import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.db.database import Base
from app.db.database import engine
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def register_and_login(
    client: TestClient,
    *,
    email: str,
    password: str = "strong-password",
) -> str:
    register_response = client.post(
        "/auth/register",
        json={"email": email, "password": password},
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200

    return login_response.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_create_organization_requires_auth(client: TestClient) -> None:
    response = client.post(
        "/organizations",
        json={"name": "Acme Workspace"},
    )

    assert response.status_code == 401


def test_list_organizations_requires_auth(client: TestClient) -> None:
    response = client.get("/organizations")

    assert response.status_code == 401


def test_get_organization_requires_auth(client: TestClient) -> None:
    response = client.get("/organizations/1")

    assert response.status_code == 401


def test_user_can_create_list_and_get_own_organization(client: TestClient) -> None:
    token = register_and_login(client, email="owner@example.com")

    create_response = client.post(
        "/organizations",
        json={"name": "Owner Workspace"},
        headers=auth_headers(token),
    )

    assert create_response.status_code == 201
    created_organization = create_response.json()

    assert created_organization["id"] > 0
    assert created_organization["name"] == "Owner Workspace"

    list_response = client.get(
        "/organizations",
        headers=auth_headers(token),
    )

    assert list_response.status_code == 200

    organizations = list_response.json()

    assert len(organizations) == 1
    assert organizations[0]["id"] == created_organization["id"]
    assert organizations[0]["name"] == created_organization["name"]
    assert organizations[0]["role"] == "owner"

    get_response = client.get(
        f"/organizations/{created_organization['id']}",
        headers=auth_headers(token),
    )

    assert get_response.status_code == 200
    assert get_response.json() == created_organization


def test_user_cannot_get_another_users_organization(client: TestClient) -> None:
    owner_token = register_and_login(client, email="owner-2@example.com")
    other_token = register_and_login(client, email="other@example.com")

    create_response = client.post(
        "/organizations",
        json={"name": "Private Workspace"},
        headers=auth_headers(owner_token),
    )

    assert create_response.status_code == 201
    organization_id = create_response.json()["id"]

    get_response = client.get(
        f"/organizations/{organization_id}",
        headers=auth_headers(other_token),
    )

    assert get_response.status_code == 404


def test_user_does_not_list_another_users_organization(client: TestClient) -> None:
    owner_token = register_and_login(client, email="owner-3@example.com")
    other_token = register_and_login(client, email="other-3@example.com")

    create_response = client.post(
        "/organizations",
        json={"name": "Hidden Workspace"},
        headers=auth_headers(owner_token),
    )

    assert create_response.status_code == 201

    list_response = client.get(
        "/organizations",
        headers=auth_headers(other_token),
    )

    assert list_response.status_code == 200
    assert list_response.json() == []



def test_list_organizations_includes_current_user_role(client: TestClient) -> None:
    token = register_and_login(
        client,
        email="organization-role-owner@example.com",
    )

    create_response = client.post(
        "/organizations",
        headers=auth_headers(token),
        json={"name": "Role Workspace"},
    )
    assert create_response.status_code == status.HTTP_201_CREATED

    list_response = client.get(
        "/organizations",
        headers=auth_headers(token),
    )
    assert list_response.status_code == status.HTTP_200_OK

    organizations = list_response.json()

    assert len(organizations) == 1
    assert organizations[0]["name"] == "Role Workspace"
    assert organizations[0]["role"] == "owner"
