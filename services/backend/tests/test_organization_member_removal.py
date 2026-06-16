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
    name: str = "Member Removal Workspace",
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


def invite_and_accept_member(
    *,
    owner_headers: dict[str, str],
    member_headers: dict[str, str],
    organization_id: int,
    email: str,
) -> dict:
    invitation_response = client.post(
        f"/organizations/{organization_id}/invitations",
        headers=owner_headers,
        json={
            "email": email,
            "role": "member",
        },
    )
    assert invitation_response.status_code == status.HTTP_201_CREATED

    invitation = invitation_response.json()

    accept_response = client.post(
        f"/organizations/invitations/{invitation['id']}/accept",
        headers=member_headers,
    )
    assert accept_response.status_code == status.HTTP_200_OK

    return accept_response.json()


def list_members(
    headers: dict[str, str],
    organization_id: int,
):
    return client.get(
        f"/organizations/{organization_id}/members",
        headers=headers,
    )


def test_owner_can_remove_workspace_member():
    owner_headers = register_and_login("remove-owner@example.com")
    member_headers = register_and_login("remove-member@example.com")

    organization = create_organization(headers=owner_headers)
    member = invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=member_headers,
        organization_id=organization["id"],
        email="remove-member@example.com",
    )

    response = client.delete(
        f"/organizations/{organization['id']}/members/{member['id']}",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    members_response = list_members(
        headers=owner_headers,
        organization_id=organization["id"],
    )

    assert members_response.status_code == status.HTTP_200_OK

    members = members_response.json()

    assert all(
        workspace_member["email"] != "remove-member@example.com"
        for workspace_member in members
    )

    removed_member_response = list_members(
        headers=member_headers,
        organization_id=organization["id"],
    )

    assert removed_member_response.status_code == status.HTTP_404_NOT_FOUND
    assert removed_member_response.json()["error"]["code"] == "not_found"


def test_member_cannot_remove_workspace_member():
    owner_headers = register_and_login("remove-private-owner@example.com")
    member_headers = register_and_login("remove-private-member@example.com")
    target_headers = register_and_login("remove-private-target@example.com")

    organization = create_organization(headers=owner_headers)
    invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=member_headers,
        organization_id=organization["id"],
        email="remove-private-member@example.com",
    )
    target_member = invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=target_headers,
        organization_id=organization["id"],
        email="remove-private-target@example.com",
    )

    response = client.delete(
        f"/organizations/{organization['id']}/members/{target_member['id']}",
        headers=member_headers,
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "workspace_owner_required"


def test_owner_cannot_remove_self():
    owner_headers = register_and_login("remove-self-owner@example.com")
    organization = create_organization(headers=owner_headers)

    members_response = list_members(
        headers=owner_headers,
        organization_id=organization["id"],
    )
    assert members_response.status_code == status.HTTP_200_OK

    owner_member = members_response.json()[0]

    response = client.delete(
        f"/organizations/{organization['id']}/members/{owner_member['id']}",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "workspace_member_self_remove_not_allowed"


def test_owner_cannot_remove_missing_member():
    owner_headers = register_and_login("remove-missing-owner@example.com")
    organization = create_organization(headers=owner_headers)

    response = client.delete(
        f"/organizations/{organization['id']}/members/999",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"


def test_remove_member_requires_authentication():
    response = client.delete("/organizations/1/members/1")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
