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
    name: str = "Member Creation Workspace",
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


def add_organization_member(
    headers: dict[str, str],
    organization_id: int,
    email: str,
    role: str = "member",
):
    return client.post(
        f"/organizations/{organization_id}/members",
        headers=headers,
        json={
            "email": email,
            "role": role,
        },
    )


def test_owner_can_add_registered_user_as_member():
    owner_headers = register_and_login("member-create-owner@example.com")
    register_and_login("member-create-user@example.com")

    organization = create_organization(headers=owner_headers)

    response = add_organization_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="member-create-user@example.com",
    )

    assert response.status_code == status.HTTP_201_CREATED

    member = response.json()

    assert member["id"] > 0
    assert member["organization_id"] == organization["id"]
    assert member["user_id"] > 0
    assert member["role"] == "member"
    assert member["email"] == "member-create-user@example.com"

    members_response = client.get(
        f"/organizations/{organization['id']}/members",
        headers=owner_headers,
    )

    assert members_response.status_code == status.HTTP_200_OK

    members = members_response.json()

    assert len(members) == 2
    assert {item["email"] for item in members} == {
        "member-create-owner@example.com",
        "member-create-user@example.com",
    }


def test_add_member_requires_authentication():
    response = client.post(
        "/organizations/1/members",
        json={
            "email": "someone@example.com",
            "role": "member",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_non_member_cannot_add_workspace_member():
    owner_headers = register_and_login("member-create-private-owner@example.com")
    other_headers = register_and_login("member-create-private-other@example.com")
    register_and_login("member-create-private-target@example.com")

    organization = create_organization(headers=owner_headers)

    response = add_organization_member(
        headers=other_headers,
        organization_id=organization["id"],
        email="member-create-private-target@example.com",
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"


def test_owner_cannot_add_self_as_member():
    owner_headers = register_and_login("member-create-self-owner@example.com")
    organization = create_organization(headers=owner_headers)

    response = add_organization_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="member-create-self-owner@example.com",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "forbidden"


def test_owner_cannot_add_duplicate_member():
    owner_headers = register_and_login("member-create-duplicate-owner@example.com")
    register_and_login("member-create-duplicate-user@example.com")

    organization = create_organization(headers=owner_headers)

    first_response = add_organization_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="member-create-duplicate-user@example.com",
    )

    assert first_response.status_code == status.HTTP_201_CREATED

    second_response = add_organization_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="member-create-duplicate-user@example.com",
    )

    assert second_response.status_code == status.HTTP_403_FORBIDDEN
    assert second_response.json()["error"]["code"] == "forbidden"


def test_owner_cannot_add_missing_user():
    owner_headers = register_and_login("member-create-missing-owner@example.com")
    organization = create_organization(headers=owner_headers)

    response = add_organization_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="not-registered@example.com",
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"


def test_only_member_role_can_be_assigned_for_now():
    owner_headers = register_and_login("member-create-role-owner@example.com")
    register_and_login("member-create-role-user@example.com")

    organization = create_organization(headers=owner_headers)

    response = add_organization_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="member-create-role-user@example.com",
        role="owner",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "forbidden"
