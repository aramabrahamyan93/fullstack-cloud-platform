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
    name: str = "Leave Workspace",
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


def test_member_can_leave_workspace():
    owner_headers = register_and_login("leave-owner@example.com")
    member_headers = register_and_login("leave-member@example.com")

    organization = create_organization(headers=owner_headers)

    invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=member_headers,
        organization_id=organization["id"],
        email="leave-member@example.com",
    )

    response = client.delete(
        f"/organizations/{organization['id']}/membership",
        headers=member_headers,
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    organizations_response = client.get(
        "/organizations",
        headers=member_headers,
    )

    assert organizations_response.status_code == status.HTTP_200_OK
    assert organizations_response.json() == []

    members_response = client.get(
        f"/organizations/{organization['id']}/members",
        headers=member_headers,
    )

    assert members_response.status_code == status.HTTP_404_NOT_FOUND
    assert members_response.json()["error"]["code"] == "not_found"


def test_owner_cannot_leave_before_transferring_ownership():
    owner_headers = register_and_login("leave-owner-blocked@example.com")
    organization = create_organization(headers=owner_headers)

    response = client.delete(
        f"/organizations/{organization['id']}/membership",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert (
        response.json()["error"]["code"]
        == "workspace_owner_cannot_leave_before_transfer"
    )


def test_non_member_cannot_leave_workspace():
    owner_headers = register_and_login("leave-private-owner@example.com")
    other_headers = register_and_login("leave-private-other@example.com")

    organization = create_organization(headers=owner_headers)

    response = client.delete(
        f"/organizations/{organization['id']}/membership",
        headers=other_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"


def test_leave_workspace_requires_authentication():
    response = client.delete("/organizations/1/membership")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
