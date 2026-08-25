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
    name: str = "Delete Workspace",
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


def test_owner_can_soft_delete_archived_workspace_by_public_id():
    owner_headers = register_and_login("delete-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    archive_workspace(headers=owner_headers, organization_ref=workspace_ref)

    response = client.delete(
        f"/organizations/{workspace_ref}",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    get_response = client.get(
        f"/organizations/{workspace_ref}",
        headers=owner_headers,
    )
    assert get_response.status_code == status.HTTP_404_NOT_FOUND


def test_owner_cannot_delete_active_workspace():
    owner_headers = register_and_login("delete-active-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    response = client.delete(
        f"/organizations/{workspace_ref}",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "workspace_delete_requires_archive"


def test_member_cannot_delete_workspace():
    owner_headers = register_and_login("delete-member-owner@example.com")
    member_email = "delete-member@example.com"
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

    response = client.delete(
        f"/organizations/{workspace_ref}",
        headers=member_headers,
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "workspace_owner_required"


def test_non_member_cannot_delete_workspace():
    owner_headers = register_and_login("delete-private-owner@example.com")
    other_headers = register_and_login("delete-private-other@example.com")
    workspace = create_workspace(owner_headers)

    archive_workspace(
        headers=owner_headers,
        organization_ref=workspace["public_id"],
    )

    response = client.delete(
        f"/organizations/{workspace['public_id']}",
        headers=other_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_deleted_workspace_adds_audit_log_before_becoming_inaccessible():
    owner_headers = register_and_login("delete-audit-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    archive_workspace(headers=owner_headers, organization_ref=workspace_ref)

    logs_before_delete_response = client.get(
        f"/organizations/{workspace_ref}/audit-logs",
        headers=owner_headers,
    )
    assert logs_before_delete_response.status_code == status.HTTP_200_OK

    response = client.delete(
        f"/organizations/{workspace_ref}",
        headers=owner_headers,
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # The workspace becomes inaccessible through normal member routes after delete.
    logs_after_delete_response = client.get(
        f"/organizations/{workspace_ref}/audit-logs",
        headers=owner_headers,
    )
    assert logs_after_delete_response.status_code == status.HTTP_404_NOT_FOUND


def test_deleted_workspace_is_not_listed_for_owner():
    owner_headers = register_and_login("delete-list-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    archive_workspace(headers=owner_headers, organization_ref=workspace_ref)

    response = client.delete(
        f"/organizations/{workspace_ref}",
        headers=owner_headers,
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    list_response = client.get("/organizations", headers=owner_headers)
    assert list_response.status_code == status.HTTP_200_OK
    assert all(
        item["public_id"] != workspace_ref
        for item in list_response.json()
    )


def test_deleted_workspace_cannot_be_restored_through_normal_routes():
    owner_headers = register_and_login("delete-restore-owner@example.com")
    workspace = create_workspace(owner_headers)
    workspace_ref = workspace["public_id"]

    archive_workspace(headers=owner_headers, organization_ref=workspace_ref)

    delete_response = client.delete(
        f"/organizations/{workspace_ref}",
        headers=owner_headers,
    )
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT

    restore_response = client.post(
        f"/organizations/{workspace_ref}/restore",
        headers=owner_headers,
    )
    assert restore_response.status_code == status.HTTP_404_NOT_FOUND
