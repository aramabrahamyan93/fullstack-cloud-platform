from fastapi import status
from fastapi.testclient import TestClient
import pytest

from app.db.database import Base
from app.db.database import engine
from app.main import app


client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def register_and_login(email: str, password: str = "strong-password") -> dict[str, str]:
    register_response = client.post(
        "/auth/register",
        json={"email": email, "password": password},
    )
    assert register_response.status_code == status.HTTP_201_CREATED

    login_response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == status.HTTP_200_OK

    return {"Authorization": f"Bearer {login_response.json()['access_token']}"}


def create_workspace(headers: dict[str, str], name: str = "Audit Workspace") -> dict:
    response = client.post(
        "/organizations",
        headers=headers,
        json={"name": name},
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
    invite_response = client.post(
        f"/organizations/{organization_id}/invitations",
        headers=owner_headers,
        json={"email": email, "role": "member"},
    )
    assert invite_response.status_code == status.HTTP_201_CREATED

    invitation_id = invite_response.json()["id"]

    accept_response = client.post(
        f"/organizations/invitations/{invitation_id}/accept",
        headers=member_headers,
    )
    assert accept_response.status_code == status.HTTP_200_OK

    return accept_response.json()


def test_audit_logs_require_authentication():
    response = client.get("/organizations/1/audit-logs")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_workspace_create_adds_audit_log():
    owner_headers = register_and_login("audit-owner@example.com")
    workspace = create_workspace(owner_headers)

    response = client.get(
        f"/organizations/{workspace['id']}/audit-logs",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_200_OK

    logs = response.json()

    assert len(logs) == 1
    assert logs[0]["organization_id"] == workspace["id"]
    assert logs[0]["event_type"] == "workspace_created"
    assert logs[0]["metadata_json"] == {"name": workspace["name"]}


def test_workspace_rename_adds_audit_log():
    owner_headers = register_and_login("audit-rename-owner@example.com")
    workspace = create_workspace(owner_headers, name="Old Audit Name")

    rename_response = client.patch(
        f"/organizations/{workspace['id']}",
        headers=owner_headers,
        json={"name": "New Audit Name"},
    )

    assert rename_response.status_code == status.HTTP_200_OK

    response = client.get(
        f"/organizations/{workspace['id']}/audit-logs",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_200_OK

    logs = response.json()

    assert [log["event_type"] for log in logs] == [
        "workspace_renamed",
        "workspace_created",
    ]
    assert logs[0]["metadata_json"] == {
        "previous_name": "Old Audit Name",
        "new_name": "New Audit Name",
    }


def test_workspace_member_can_view_audit_logs():
    owner_headers = register_and_login("audit-member-owner@example.com")
    member_email = "audit-member@example.com"
    member_headers = register_and_login(member_email)
    workspace = create_workspace(owner_headers)

    invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=member_headers,
        organization_id=workspace["id"],
        email=member_email,
    )

    response = client.get(
        f"/organizations/{workspace['id']}/audit-logs",
        headers=member_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()[0]["event_type"] == "workspace_created"


def test_non_member_cannot_view_audit_logs():
    owner_headers = register_and_login("audit-private-owner@example.com")
    other_headers = register_and_login("audit-private-other@example.com")
    workspace = create_workspace(owner_headers)

    response = client.get(
        f"/organizations/{workspace['id']}/audit-logs",
        headers=other_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
