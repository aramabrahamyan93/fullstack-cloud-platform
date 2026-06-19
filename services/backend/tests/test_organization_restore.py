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


def create_workspace(
    headers: dict[str, str],
    name: str = "Restore Workspace",
) -> dict:
    response = client.post(
        "/organizations",
        headers=headers,
        json={"name": name},
    )
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()


def archive_workspace(
    *,
    headers: dict[str, str],
    organization_ref: int | str,
) -> dict:
    response = client.post(
        f"/organizations/{organization_ref}/archive",
        headers=headers,
    )
    assert response.status_code == status.HTTP_200_OK
    return response.json()


def invite_and_accept_member(
    *,
    owner_headers: dict[str, str],
    member_headers: dict[str, str],
    organization_ref: int | str,
    email: str,
) -> dict:
    invitation_response = client.post(
        f"/organizations/{organization_ref}/invitations",
        headers=owner_headers,
        json={
            "email": email,
            "role": "member",
        },
    )
    assert invitation_response.status_code == status.HTTP_201_CREATED

    invitation_id = invitation_response.json()["id"]

    accept_response = client.post(
        f"/organizations/invitations/{invitation_id}/accept",
        headers=member_headers,
    )
    assert accept_response.status_code == status.HTTP_200_OK

    return accept_response.json()


def create_workspace_task(
    *,
    headers: dict[str, str],
    organization_ref: int | str,
    title: str = "Restored workspace task",
):
    return client.post(
        f"/organizations/{organization_ref}/tasks",
        headers=headers,
        json={
            "title": title,
            "status": "open",
        },
    )


def test_owner_can_restore_archived_workspace_by_public_id():
    owner_headers = register_and_login("restore-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    archive_workspace(headers=owner_headers, organization_ref=workspace_ref)

    response = client.post(
        f"/organizations/{workspace_ref}/restore",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == workspace["id"]
    assert response.json()["public_id"] == workspace_ref
    assert response.json()["status"] == "active"
    assert response.json()["role"] == "owner"

    get_response = client.get(
        f"/organizations/{workspace_ref}",
        headers=owner_headers,
    )
    assert get_response.status_code == status.HTTP_200_OK
    assert get_response.json()["status"] == "active"


def test_restoring_active_workspace_is_idempotent():
    owner_headers = register_and_login("restore-idempotent-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    first_response = client.post(
        f"/organizations/{workspace_ref}/restore",
        headers=owner_headers,
    )
    assert first_response.status_code == status.HTTP_200_OK
    assert first_response.json()["status"] == "active"

    second_response = client.post(
        f"/organizations/{workspace_ref}/restore",
        headers=owner_headers,
    )
    assert second_response.status_code == status.HTTP_200_OK
    assert second_response.json()["status"] == "active"

    logs_response = client.get(
        f"/organizations/{workspace_ref}/audit-logs",
        headers=owner_headers,
    )
    assert logs_response.status_code == status.HTTP_200_OK

    restore_events = [
        log for log in logs_response.json()
        if log["event_type"] == "workspace_restored"
    ]
    assert restore_events == []


def test_restoring_archived_workspace_is_idempotent_after_first_restore():
    owner_headers = register_and_login("restore-after-archive-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    archive_workspace(headers=owner_headers, organization_ref=workspace_ref)

    first_response = client.post(
        f"/organizations/{workspace_ref}/restore",
        headers=owner_headers,
    )
    assert first_response.status_code == status.HTTP_200_OK
    assert first_response.json()["status"] == "active"

    second_response = client.post(
        f"/organizations/{workspace_ref}/restore",
        headers=owner_headers,
    )
    assert second_response.status_code == status.HTTP_200_OK
    assert second_response.json()["status"] == "active"

    logs_response = client.get(
        f"/organizations/{workspace_ref}/audit-logs",
        headers=owner_headers,
    )
    assert logs_response.status_code == status.HTTP_200_OK

    restore_events = [
        log for log in logs_response.json()
        if log["event_type"] == "workspace_restored"
    ]
    assert len(restore_events) == 1


def test_member_cannot_restore_workspace():
    owner_headers = register_and_login("restore-member-owner@example.com")
    member_email = "restore-member@example.com"
    member_headers = register_and_login(member_email)
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=member_headers,
        organization_ref=workspace_ref,
        email=member_email,
    )

    archive_workspace(headers=owner_headers, organization_ref=workspace_ref)

    response = client.post(
        f"/organizations/{workspace_ref}/restore",
        headers=member_headers,
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "workspace_owner_required"


def test_non_member_cannot_restore_workspace():
    owner_headers = register_and_login("restore-private-owner@example.com")
    other_headers = register_and_login("restore-private-other@example.com")
    workspace = create_workspace(owner_headers)

    archive_workspace(
        headers=owner_headers,
        organization_ref=workspace["public_id"],
    )

    response = client.post(
        f"/organizations/{workspace['public_id']}/restore",
        headers=other_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_restore_adds_audit_log():
    owner_headers = register_and_login("restore-audit-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    archive_workspace(headers=owner_headers, organization_ref=workspace_ref)

    response = client.post(
        f"/organizations/{workspace_ref}/restore",
        headers=owner_headers,
    )
    assert response.status_code == status.HTTP_200_OK

    logs_response = client.get(
        f"/organizations/{workspace_ref}/audit-logs",
        headers=owner_headers,
    )
    assert logs_response.status_code == status.HTTP_200_OK

    event_types = [log["event_type"] for log in logs_response.json()]
    assert event_types == [
        "workspace_restored",
        "workspace_archived",
        "workspace_created",
    ]

    restore_log = logs_response.json()[0]
    assert restore_log["metadata_json"] == {
        "previous_status": "archived",
        "new_status": "active",
    }


def test_restored_workspace_allows_task_writes_again():
    owner_headers = register_and_login("restore-task-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    create_before_archive_response = create_workspace_task(
        headers=owner_headers,
        organization_ref=workspace_ref,
        title="Before archive",
    )
    assert create_before_archive_response.status_code == status.HTTP_201_CREATED

    archive_workspace(headers=owner_headers, organization_ref=workspace_ref)

    create_after_archive_response = create_workspace_task(
        headers=owner_headers,
        organization_ref=workspace_ref,
        title="After archive",
    )
    assert create_after_archive_response.status_code == status.HTTP_403_FORBIDDEN
    assert create_after_archive_response.json()["error"]["code"] == "workspace_archived"

    restore_response = client.post(
        f"/organizations/{workspace_ref}/restore",
        headers=owner_headers,
    )
    assert restore_response.status_code == status.HTTP_200_OK
    assert restore_response.json()["status"] == "active"

    create_after_restore_response = create_workspace_task(
        headers=owner_headers,
        organization_ref=workspace_ref,
        title="After restore",
    )
    assert create_after_restore_response.status_code == status.HTTP_201_CREATED


def test_restored_workspace_allows_rename_and_invitation_again():
    owner_headers = register_and_login("restore-restrictions-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    archive_workspace(headers=owner_headers, organization_ref=workspace_ref)

    restore_response = client.post(
        f"/organizations/{workspace_ref}/restore",
        headers=owner_headers,
    )
    assert restore_response.status_code == status.HTTP_200_OK

    rename_response = client.patch(
        f"/organizations/{workspace_ref}",
        headers=owner_headers,
        json={"name": "Restored Workspace Renamed"},
    )
    assert rename_response.status_code == status.HTTP_200_OK
    assert rename_response.json()["name"] == "Restored Workspace Renamed"

    invite_response = client.post(
        f"/organizations/{workspace_ref}/invitations",
        headers=owner_headers,
        json={
            "email": "restore-invite-allowed@example.com",
            "role": "member",
        },
    )
    assert invite_response.status_code == status.HTTP_201_CREATED
