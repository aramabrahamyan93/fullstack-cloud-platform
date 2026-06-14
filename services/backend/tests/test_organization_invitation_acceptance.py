from fastapi import status
from fastapi.testclient import TestClient

from app.db.database import Base
from app.db.database import engine
from app.main import app


client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def register_and_login(
    email: str,
    password: str = "strong-password",
) -> dict[str, str]:
    register_response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
        },
    )
    assert register_response.status_code == status.HTTP_201_CREATED

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert login_response.status_code == status.HTTP_200_OK

    return {
        "Authorization": f"Bearer {login_response.json()['access_token']}",
    }


def create_organization(
    headers: dict[str, str],
    name: str = "Invitation Acceptance Workspace",
) -> dict:
    response = client.post(
        "/organizations",
        headers=headers,
        json={
            "name": name,
        },
    )

    assert response.status_code == status.HTTP_201_CREATED

    return response.json()


def create_invitation(
    headers: dict[str, str],
    organization_id: int,
    email: str,
):
    response = client.post(
        f"/organizations/{organization_id}/invitations",
        headers=headers,
        json={
            "email": email,
            "role": "member",
        },
    )

    assert response.status_code == status.HTTP_201_CREATED

    return response.json()


def test_invited_user_can_list_pending_invitations():
    owner_headers = register_and_login("accept-list-owner@example.com")
    invited_headers = register_and_login("accept-list-user@example.com")
    organization = create_organization(headers=owner_headers)

    create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="accept-list-user@example.com",
    )

    response = client.get(
        "/organizations/invitations/me",
        headers=invited_headers,
    )

    assert response.status_code == status.HTTP_200_OK

    invitations = response.json()

    assert len(invitations) == 1
    assert invitations[0]["organization_id"] == organization["id"]
    assert invitations[0]["email"] == "accept-list-user@example.com"
    assert invitations[0]["status"] == "pending"


def test_invited_user_can_accept_invitation_and_become_member():
    owner_headers = register_and_login("accept-owner@example.com")
    invited_headers = register_and_login("accept-user@example.com")
    organization = create_organization(headers=owner_headers)

    invitation = create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="accept-user@example.com",
    )

    accept_response = client.post(
        f"/organizations/invitations/{invitation['id']}/accept",
        headers=invited_headers,
    )

    assert accept_response.status_code == status.HTTP_200_OK

    member = accept_response.json()

    assert member["organization_id"] == organization["id"]
    assert member["email"] == "accept-user@example.com"
    assert member["role"] == "member"

    members_response = client.get(
        f"/organizations/{organization['id']}/members",
        headers=invited_headers,
    )

    assert members_response.status_code == status.HTTP_200_OK

    members = members_response.json()

    assert any(
        workspace_member["email"] == "accept-user@example.com"
        for workspace_member in members
    )

    invitations_response = client.get(
        "/organizations/invitations/me",
        headers=invited_headers,
    )

    assert invitations_response.status_code == status.HTTP_200_OK
    assert invitations_response.json() == []


def test_invited_user_can_decline_invitation_without_becoming_member():
    owner_headers = register_and_login("decline-owner@example.com")
    invited_headers = register_and_login("decline-user@example.com")
    organization = create_organization(headers=owner_headers)

    invitation = create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="decline-user@example.com",
    )

    decline_response = client.post(
        f"/organizations/invitations/{invitation['id']}/decline",
        headers=invited_headers,
    )

    assert decline_response.status_code == status.HTTP_200_OK
    assert decline_response.json()["status"] == "declined"

    members_response = client.get(
        f"/organizations/{organization['id']}/members",
        headers=owner_headers,
    )

    assert members_response.status_code == status.HTTP_200_OK

    members = members_response.json()

    assert all(
        workspace_member["email"] != "decline-user@example.com"
        for workspace_member in members
    )


def test_user_cannot_accept_another_users_invitation():
    owner_headers = register_and_login("other-accept-owner@example.com")
    register_and_login("real-invited-user@example.com")
    other_headers = register_and_login("wrong-invited-user@example.com")
    organization = create_organization(headers=owner_headers)

    invitation = create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="real-invited-user@example.com",
    )

    response = client.post(
        f"/organizations/invitations/{invitation['id']}/accept",
        headers=other_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"
