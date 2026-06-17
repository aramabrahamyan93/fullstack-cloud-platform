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


def create_workspace(
    client: TestClient,
    token: str,
    name: str = "Dashboard Workspace",
) -> dict:
    response = client.post(
        "/organizations",
        json={"name": name},
        headers=auth_headers(token),
    )
    assert response.status_code == 201

    return response.json()


def create_workspace_task(
    client: TestClient,
    token: str,
    organization_id: int,
    title: str,
    status: str,
) -> dict:
    response = client.post(
        f"/organizations/{organization_id}/tasks",
        json={
            "title": title,
            "status": status,
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 201

    return response.json()


def get_error_code(response_json: dict) -> str | None:
    if "code" in response_json:
        return response_json["code"]

    error = response_json.get("error")

    if isinstance(error, dict):
        return error.get("code")

    detail = response_json.get("detail")

    if isinstance(detail, dict):
        return detail.get("code")

    return None


def test_workspace_owner_can_view_dashboard_summary(client: TestClient) -> None:
    owner_token = register_and_login(client, unique_email("dashboard-owner"))
    workspace = create_workspace(client, owner_token)

    create_workspace_task(
        client,
        owner_token,
        workspace["id"],
        "Open dashboard task",
        "open",
    )
    create_workspace_task(
        client,
        owner_token,
        workspace["id"],
        "In progress dashboard task",
        "in_progress",
    )
    create_workspace_task(
        client,
        owner_token,
        workspace["id"],
        "Done dashboard task",
        "done",
    )

    invite_response = client.post(
        f"/organizations/{workspace['id']}/invitations",
        json={
            "email": unique_email("dashboard-pending-member"),
            "role": "member",
        },
        headers=auth_headers(owner_token),
    )
    assert invite_response.status_code == 201

    response = client.get(
        f"/organizations/{workspace['id']}/dashboard",
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 200
    assert response.json() == {
        "organization_id": workspace["id"],
        "organization_public_id": workspace["public_id"],
        "task_counts": {
            "all": 3,
            "open": 1,
            "in_progress": 1,
            "done": 1,
        },
        "members_count": 1,
        "pending_invitations_count": 1,
        "recent_activity_count": 2,
    }


def test_workspace_member_can_view_dashboard_summary(client: TestClient) -> None:
    member_email = unique_email("dashboard-member")

    owner_token = register_and_login(
        client,
        unique_email("dashboard-member-owner"),
    )
    member_token = register_and_login(client, member_email)
    workspace = create_workspace(client, owner_token)

    invite_response = client.post(
        f"/organizations/{workspace['id']}/invitations",
        json={
            "email": member_email,
            "role": "member",
        },
        headers=auth_headers(owner_token),
    )
    assert invite_response.status_code == 201

    accept_response = client.post(
        f"/organizations/invitations/{invite_response.json()['id']}/accept",
        headers=auth_headers(member_token),
    )
    assert accept_response.status_code == 200

    response = client.get(
        f"/organizations/{workspace['id']}/dashboard",
        headers=auth_headers(member_token),
    )

    assert response.status_code == 200
    assert response.json()["organization_id"] == workspace["id"]
    assert response.json()["members_count"] == 2


def test_non_member_cannot_view_dashboard_summary(client: TestClient) -> None:
    owner_token = register_and_login(
        client,
        unique_email("dashboard-non-member-owner"),
    )
    outsider_token = register_and_login(
        client,
        unique_email("dashboard-outsider"),
    )
    workspace = create_workspace(client, owner_token)

    response = client.get(
        f"/organizations/{workspace['id']}/dashboard",
        headers=auth_headers(outsider_token),
    )

    assert response.status_code == 404
    assert get_error_code(response.json()) == "not_found"
