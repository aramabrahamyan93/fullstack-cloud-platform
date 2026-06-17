from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def unique_email(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex}@example.com"


def register_and_login(client: TestClient, email: str) -> str:
    password = "StrongPass123"

    register_response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert login_response.status_code == 200

    return login_response.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_workspace(client: TestClient, token: str, name: str = "Public ID Workspace") -> dict:
    response = client.post(
        "/organizations",
        json={"name": name},
        headers=auth_headers(token),
    )
    assert response.status_code == 201

    return response.json()


def test_created_workspace_returns_public_id(client: TestClient) -> None:
    token = register_and_login(client, unique_email("public-id-owner"))

    workspace = create_workspace(client, token)

    assert workspace["id"] > 0
    assert workspace["public_id"].startswith("ws_")
    assert len(workspace["public_id"]) > len("ws_")


def test_list_workspaces_returns_public_id(client: TestClient) -> None:
    token = register_and_login(client, unique_email("public-id-list-owner"))
    workspace = create_workspace(client, token)

    response = client.get(
        "/organizations",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert any(
        item["id"] == workspace["id"]
        and item["public_id"] == workspace["public_id"]
        for item in response.json()
    )


def test_workspace_dashboard_returns_public_id(client: TestClient) -> None:
    token = register_and_login(client, unique_email("public-id-dashboard-owner"))
    workspace = create_workspace(client, token)

    response = client.get(
        f"/organizations/{workspace['id']}/dashboard",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json()["organization_id"] == workspace["id"]
    assert response.json()["organization_public_id"] == workspace["public_id"]
