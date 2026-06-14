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
    name: str = "Invitation Workspace",
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


def create_invitation(
    headers: dict[str, str],
    organization_id: int,
    email: str = "invited@example.com",
    role: str = "member",
):
    return client.post(
        f"/organizations/{organization_id}/invitations",
        headers=headers,
        json={
            "email": email,
            "role": role,
        },
    )


def test_owner_can_create_pending_invitation_for_unregistered_email():
    owner_headers = register_and_login("invite-owner@example.com")
    organization = create_organization(headers=owner_headers)

    response = create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="not-yet-registered@example.com",
    )

    assert response.status_code == status.HTTP_201_CREATED

    invitation = response.json()

    assert invitation["id"] > 0
    assert invitation["organization_id"] == organization["id"]
    assert invitation["email"] == "not-yet-registered@example.com"
    assert invitation["role"] == "member"
    assert invitation["status"] == "pending"
    assert invitation["invited_by_user_id"] > 0
    assert invitation["expires_at"]
    assert invitation["created_at"]


def test_owner_can_list_organization_invitations():
    owner_headers = register_and_login("invite-list-owner@example.com")
    organization = create_organization(headers=owner_headers)

    create_response = create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="list-invited@example.com",
    )

    assert create_response.status_code == status.HTTP_201_CREATED

    response = client.get(
        f"/organizations/{organization['id']}/invitations",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_200_OK

    invitations = response.json()

    assert len(invitations) == 1
    assert invitations[0]["email"] == "list-invited@example.com"
    assert invitations[0]["status"] == "pending"


def test_create_invitation_requires_owner():
    owner_headers = register_and_login("invite-private-owner@example.com")
    other_headers = register_and_login("invite-private-other@example.com")

    organization = create_organization(headers=owner_headers)

    response = create_invitation(
        headers=other_headers,
        organization_id=organization["id"],
        email="private-invited@example.com",
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"


def test_owner_cannot_create_duplicate_pending_invitation():
    owner_headers = register_and_login("invite-duplicate-owner@example.com")
    organization = create_organization(headers=owner_headers)

    first_response = create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="duplicate-invited@example.com",
    )
    assert first_response.status_code == status.HTTP_201_CREATED

    second_response = create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="duplicate-invited@example.com",
    )

    assert second_response.status_code == status.HTTP_403_FORBIDDEN
    assert second_response.json()["error"]["code"] == "workspace_invitation_already_pending"


def test_owner_cannot_invite_existing_workspace_member():
    owner_headers = register_and_login("invite-existing-owner@example.com")
    register_and_login("invite-existing-member@example.com")

    organization = create_organization(headers=owner_headers)

    add_member_response = client.post(
        f"/organizations/{organization['id']}/members",
        headers=owner_headers,
        json={
            "email": "invite-existing-member@example.com",
            "role": "member",
        },
    )
    assert add_member_response.status_code == status.HTTP_201_CREATED

    response = create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="invite-existing-member@example.com",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "workspace_invitation_user_already_member"


def test_only_member_role_can_be_invited_for_now():
    owner_headers = register_and_login("invite-role-owner@example.com")
    organization = create_organization(headers=owner_headers)

    response = create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="role-invited@example.com",
        role="owner",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "workspace_invitation_invalid_role"


def test_owner_can_cancel_invitation():
    owner_headers = register_and_login("invite-cancel-owner@example.com")
    organization = create_organization(headers=owner_headers)

    create_response = create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="cancel-invited@example.com",
    )
    assert create_response.status_code == status.HTTP_201_CREATED

    invitation_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/organizations/{organization['id']}/invitations/{invitation_id}",
        headers=owner_headers,
    )

    assert delete_response.status_code == status.HTTP_204_NO_CONTENT

    list_response = client.get(
        f"/organizations/{organization['id']}/invitations",
        headers=owner_headers,
    )

    assert list_response.status_code == status.HTTP_200_OK

    invitations = list_response.json()

    assert len(invitations) == 1
    assert invitations[0]["status"] == "cancelled"
