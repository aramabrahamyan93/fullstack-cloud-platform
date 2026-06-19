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
    name: str = "Archive Workspace",
) -> dict:
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
    title: str = "Archived workspace task",
):
    return client.post(
        f"/organizations/{organization_ref}/tasks",
        headers=headers,
        json={
            "title": title,
            "status": "open",
        },
    )


def test_created_workspace_defaults_to_active():
    owner_headers = register_and_login("archive-active-owner@example.com")
    workspace = create_workspace(owner_headers)

    assert workspace["status"] == "active"

    list_response = client.get("/organizations", headers=owner_headers)
    assert list_response.status_code == status.HTTP_200_OK
    assert list_response.json()[0]["status"] == "active"


def test_owner_can_archive_workspace_by_public_id():
    owner_headers = register_and_login("archive-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    response = client.post(
        f"/organizations/{workspace_ref}/archive",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == workspace["id"]
    assert response.json()["public_id"] == workspace_ref
    assert response.json()["status"] == "archived"
    assert response.json()["role"] == "owner"

    get_response = client.get(
        f"/organizations/{workspace_ref}",
        headers=owner_headers,
    )
    assert get_response.status_code == status.HTTP_200_OK
    assert get_response.json()["status"] == "archived"


def test_archiving_workspace_is_idempotent():
    owner_headers = register_and_login("archive-idempotent-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    first_response = client.post(
        f"/organizations/{workspace_ref}/archive",
        headers=owner_headers,
    )
    assert first_response.status_code == status.HTTP_200_OK

    second_response = client.post(
        f"/organizations/{workspace_ref}/archive",
        headers=owner_headers,
    )
    assert second_response.status_code == status.HTTP_200_OK
    assert second_response.json()["status"] == "archived"

    logs_response = client.get(
        f"/organizations/{workspace_ref}/audit-logs",
        headers=owner_headers,
    )
    assert logs_response.status_code == status.HTTP_200_OK

    archive_events = [
        log for log in logs_response.json()
        if log["event_type"] == "workspace_archived"
    ]
    assert len(archive_events) == 1


def test_member_cannot_archive_workspace():
    owner_headers = register_and_login("archive-member-owner@example.com")
    member_email = "archive-member@example.com"
    member_headers = register_and_login(member_email)
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=member_headers,
        organization_ref=workspace_ref,
        email=member_email,
    )

    response = client.post(
        f"/organizations/{workspace_ref}/archive",
        headers=member_headers,
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "workspace_owner_required"


def test_non_member_cannot_archive_workspace():
    owner_headers = register_and_login("archive-private-owner@example.com")
    other_headers = register_and_login("archive-private-other@example.com")
    workspace = create_workspace(owner_headers)

    response = client.post(
        f"/organizations/{workspace['public_id']}/archive",
        headers=other_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_archived_workspace_blocks_task_writes_but_allows_reads():
    owner_headers = register_and_login("archive-task-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    create_response = create_workspace_task(
        headers=owner_headers,
        organization_ref=workspace_ref,
        title="Before archive",
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    task_id = create_response.json()["id"]

    archive_response = client.post(
        f"/organizations/{workspace_ref}/archive",
        headers=owner_headers,
    )
    assert archive_response.status_code == status.HTTP_200_OK

    list_response = client.get(
        f"/organizations/{workspace_ref}/tasks",
        headers=owner_headers,
    )
    assert list_response.status_code == status.HTTP_200_OK
    assert len(list_response.json()) == 1

    create_after_archive_response = create_workspace_task(
        headers=owner_headers,
        organization_ref=workspace_ref,
        title="After archive",
    )
    assert create_after_archive_response.status_code == status.HTTP_403_FORBIDDEN
    assert create_after_archive_response.json()["error"]["code"] == "workspace_archived"

    update_response = client.put(
        f"/organizations/{workspace_ref}/tasks/{task_id}",
        headers=owner_headers,
        json={
            "title": "Should not update",
            "status": "done",
        },
    )
    assert update_response.status_code == status.HTTP_403_FORBIDDEN
    assert update_response.json()["error"]["code"] == "workspace_archived"

    delete_response = client.delete(
        f"/organizations/{workspace_ref}/tasks/{task_id}",
        headers=owner_headers,
    )
    assert delete_response.status_code == status.HTTP_403_FORBIDDEN
    assert delete_response.json()["error"]["code"] == "workspace_archived"


def test_archive_adds_audit_log():
    owner_headers = register_and_login("archive-audit-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    response = client.post(
        f"/organizations/{workspace_ref}/archive",
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
        "workspace_archived",
        "workspace_created",
    ]

    archive_log = logs_response.json()[0]
    assert archive_log["metadata_json"] == {
        "previous_status": "active",
        "new_status": "archived",
    }


def test_archived_workspace_cannot_be_renamed_or_invited_to():
    owner_headers = register_and_login("archive-restrictions-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    archive_response = client.post(
        f"/organizations/{workspace_ref}/archive",
        headers=owner_headers,
    )
    assert archive_response.status_code == status.HTTP_200_OK

    rename_response = client.patch(
        f"/organizations/{workspace_ref}",
        headers=owner_headers,
        json={"name": "Should not rename"},
    )
    assert rename_response.status_code == status.HTTP_403_FORBIDDEN
    assert rename_response.json()["error"]["code"] == "workspace_archived"

    invite_response = client.post(
        f"/organizations/{workspace_ref}/invitations",
        headers=owner_headers,
        json={
            "email": "archive-invite-blocked@example.com",
            "role": "member",
        },
    )
    assert invite_response.status_code == status.HTTP_403_FORBIDDEN
    assert invite_response.json()["error"]["code"] == "workspace_archived"
