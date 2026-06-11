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
    name: str = "Members Workspace",
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


def test_list_organization_members_requires_authentication():
    response = client.get("/organizations/1/members")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_owner_can_list_organization_members():
    headers = register_and_login("members-owner@example.com")
    organization = create_organization(headers=headers)

    response = client.get(
        f"/organizations/{organization['id']}/members",
        headers=headers,
    )

    assert response.status_code == status.HTTP_200_OK

    members = response.json()

    assert len(members) == 1

    owner_member = members[0]

    assert owner_member["id"] > 0
    assert owner_member["organization_id"] == organization["id"]
    assert owner_member["user_id"] > 0
    assert owner_member["role"] == "owner"
    assert owner_member["email"] == "members-owner@example.com"


def test_non_member_cannot_list_organization_members():
    owner_headers = register_and_login("members-private-owner@example.com")
    other_headers = register_and_login("members-private-other@example.com")

    organization = create_organization(
        headers=owner_headers,
        name="Private Members Workspace",
    )

    response = client.get(
        f"/organizations/{organization['id']}/members",
        headers=other_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"


def test_members_endpoint_returns_not_found_for_missing_organization():
    headers = register_and_login("members-missing-owner@example.com")

    response = client.get(
        "/organizations/999/members",
        headers=headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"
