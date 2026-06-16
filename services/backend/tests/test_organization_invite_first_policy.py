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
    name: str = "Invite First Workspace",
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


def test_direct_member_add_endpoint_is_not_available():
    owner_headers = register_and_login("invite-first-owner@example.com")
    register_and_login("invite-first-user@example.com")

    organization = create_organization(headers=owner_headers)

    response = client.post(
        f"/organizations/{organization['id']}/members",
        headers=owner_headers,
        json={
            "email": "invite-first-user@example.com",
            "role": "member",
        },
    )

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


def test_membership_is_created_by_accepting_invitation():
    owner_headers = register_and_login("invite-first-real-owner@example.com")
    member_headers = register_and_login("invite-first-real-member@example.com")

    organization = create_organization(headers=owner_headers)

    invitation_response = client.post(
        f"/organizations/{organization['id']}/invitations",
        headers=owner_headers,
        json={
            "email": "invite-first-real-member@example.com",
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

    member = accept_response.json()

    assert member["organization_id"] == organization["id"]
    assert member["role"] == "member"
    assert member["email"] == "invite-first-real-member@example.com"
