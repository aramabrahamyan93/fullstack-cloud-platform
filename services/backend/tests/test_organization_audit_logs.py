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



def create_invitation(
    *,
    owner_headers: dict[str, str],
    organization_id: int,
    email: str,
) -> dict:
    response = client.post(
        f"/organizations/{organization_id}/invitations",
        headers=owner_headers,
        json={"email": email, "role": "member"},
    )

    assert response.status_code == status.HTTP_201_CREATED

    return response.json()


def list_audit_event_types(
    *,
    headers: dict[str, str],
    organization_id: int,
) -> list[str]:
    response = client.get(
        f"/organizations/{organization_id}/audit-logs",
        headers=headers,
    )

    assert response.status_code == status.HTTP_200_OK

    return [log["event_type"] for log in response.json()]


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

    event_types = [log["event_type"] for log in response.json()]

    assert event_types == [
        "invitation_accepted",
        "member_invited",
        "workspace_created",
    ]


def test_non_member_cannot_view_audit_logs():
    owner_headers = register_and_login("audit-private-owner@example.com")
    other_headers = register_and_login("audit-private-other@example.com")
    workspace = create_workspace(owner_headers)

    response = client.get(
        f"/organizations/{workspace['id']}/audit-logs",
        headers=other_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND



def test_invitation_lifecycle_adds_audit_logs():
    owner_headers = register_and_login("audit-invite-owner@example.com")
    invited_email = "audit-invited-user@example.com"
    invited_headers = register_and_login(invited_email)
    workspace = create_workspace(owner_headers)

    invitation = create_invitation(
        owner_headers=owner_headers,
        organization_id=workspace["id"],
        email=invited_email,
    )

    after_invite_events = list_audit_event_types(
        headers=owner_headers,
        organization_id=workspace["id"],
    )

    assert after_invite_events == [
        "member_invited",
        "workspace_created",
    ]

    accept_response = client.post(
        f"/organizations/invitations/{invitation['id']}/accept",
        headers=invited_headers,
    )

    assert accept_response.status_code == status.HTTP_200_OK

    after_accept_events = list_audit_event_types(
        headers=owner_headers,
        organization_id=workspace["id"],
    )

    assert after_accept_events == [
        "invitation_accepted",
        "member_invited",
        "workspace_created",
    ]


def test_invitation_decline_and_cancel_add_audit_logs():
    owner_headers = register_and_login("audit-invite-control-owner@example.com")
    decline_email = "audit-decline-user@example.com"
    decline_headers = register_and_login(decline_email)
    workspace = create_workspace(owner_headers)

    decline_invitation = create_invitation(
        owner_headers=owner_headers,
        organization_id=workspace["id"],
        email=decline_email,
    )

    decline_response = client.post(
        f"/organizations/invitations/{decline_invitation['id']}/decline",
        headers=decline_headers,
    )

    assert decline_response.status_code == status.HTTP_200_OK

    cancel_invitation = create_invitation(
        owner_headers=owner_headers,
        organization_id=workspace["id"],
        email="audit-cancel-user@example.com",
    )

    cancel_response = client.delete(
        f"/organizations/{workspace['id']}/invitations/{cancel_invitation['id']}",
        headers=owner_headers,
    )

    assert cancel_response.status_code == status.HTTP_204_NO_CONTENT

    events = list_audit_event_types(
        headers=owner_headers,
        organization_id=workspace["id"],
    )

    assert events == [
        "invitation_cancelled",
        "member_invited",
        "invitation_declined",
        "member_invited",
        "workspace_created",
    ]


def test_member_remove_transfer_and_leave_add_audit_logs():
    owner_headers = register_and_login("audit-admin-owner@example.com")
    remove_email = "audit-remove-member@example.com"
    new_owner_email = "audit-new-owner@example.com"
    leave_email = "audit-leave-member@example.com"

    remove_headers = register_and_login(remove_email)
    new_owner_headers = register_and_login(new_owner_email)
    leave_headers = register_and_login(leave_email)

    workspace = create_workspace(owner_headers)

    remove_member = invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=remove_headers,
        organization_id=workspace["id"],
        email=remove_email,
    )
    new_owner_member = invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=new_owner_headers,
        organization_id=workspace["id"],
        email=new_owner_email,
    )
    invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=leave_headers,
        organization_id=workspace["id"],
        email=leave_email,
    )

    remove_response = client.delete(
        f"/organizations/{workspace['id']}/members/{remove_member['id']}",
        headers=owner_headers,
    )

    assert remove_response.status_code == status.HTTP_204_NO_CONTENT

    transfer_response = client.post(
        f"/organizations/{workspace['id']}/members/{new_owner_member['id']}/transfer-ownership",
        headers=owner_headers,
    )

    assert transfer_response.status_code == status.HTTP_204_NO_CONTENT

    leave_response = client.delete(
        f"/organizations/{workspace['id']}/membership",
        headers=leave_headers,
    )

    assert leave_response.status_code == status.HTTP_204_NO_CONTENT

    events = list_audit_event_types(
        headers=new_owner_headers,
        organization_id=workspace["id"],
    )

    assert events[:4] == [
        "workspace_left",
        "ownership_transferred",
        "member_removed",
        "invitation_accepted",
    ]

    assert "workspace_created" in events
