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


def create_workspace(headers: dict[str, str], name: str = "Public API Workspace") -> dict:
    response = client.post(
        "/organizations",
        headers=headers,
        json={"name": name},
    )

    assert response.status_code == status.HTTP_201_CREATED

    return response.json()


def create_invitation(
    *,
    headers: dict[str, str],
    organization_ref: str,
    email: str,
):
    return client.post(
        f"/organizations/{organization_ref}/invitations",
        headers=headers,
        json={
            "email": email,
            "role": "member",
        },
    )


def invite_and_accept_member(
    *,
    owner_headers: dict[str, str],
    member_headers: dict[str, str],
    organization_ref: str,
    email: str,
) -> dict:
    invitation_response = create_invitation(
        headers=owner_headers,
        organization_ref=organization_ref,
        email=email,
    )
    assert invitation_response.status_code == status.HTTP_201_CREATED

    invitation = invitation_response.json()

    accept_response = client.post(
        f"/organizations/invitations/{invitation['id']}/accept",
        headers=member_headers,
    )
    assert accept_response.status_code == status.HTTP_200_OK

    return accept_response.json()


def test_members_can_be_listed_by_workspace_public_id():
    owner_headers = register_and_login("remaining-members-owner@example.com")
    workspace = create_workspace(owner_headers)

    response = client.get(
        f"/organizations/{workspace['public_id']}/members",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()[0]["organization_id"] == workspace["id"]
    assert response.json()[0]["role"] == "owner"


def test_invitations_can_be_created_listed_and_cancelled_by_workspace_public_id():
    owner_headers = register_and_login("remaining-invite-owner@example.com")
    workspace = create_workspace(owner_headers)

    create_response = create_invitation(
        headers=owner_headers,
        organization_ref=workspace["public_id"],
        email="remaining-invited@example.com",
    )

    assert create_response.status_code == status.HTTP_201_CREATED
    invitation = create_response.json()
    assert invitation["organization_id"] == workspace["id"]

    list_response = client.get(
        f"/organizations/{workspace['public_id']}/invitations",
        headers=owner_headers,
    )

    assert list_response.status_code == status.HTTP_200_OK
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["id"] == invitation["id"]

    cancel_response = client.delete(
        f"/organizations/{workspace['public_id']}/invitations/{invitation['id']}",
        headers=owner_headers,
    )

    assert cancel_response.status_code == status.HTTP_204_NO_CONTENT

    list_after_cancel_response = client.get(
        f"/organizations/{workspace['public_id']}/invitations",
        headers=owner_headers,
    )

    assert list_after_cancel_response.status_code == status.HTTP_200_OK
    assert list_after_cancel_response.json() == []


def test_invite_candidates_can_be_listed_by_workspace_public_id():
    owner_headers = register_and_login("remaining-candidate-owner@example.com")
    register_and_login("remaining-candidate-user@example.com")
    workspace = create_workspace(owner_headers)

    response = client.get(
        f"/organizations/{workspace['public_id']}/invite-candidates",
        headers=owner_headers,
        params={"query": "remaining-candidate-user"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()[0]["email"] == "remaining-candidate-user@example.com"
    assert response.json()[0]["membership_status"] == "not_member"


def test_member_can_be_removed_by_workspace_public_id():
    owner_headers = register_and_login("remaining-remove-owner@example.com")
    member_headers = register_and_login("remaining-remove-member@example.com")
    workspace = create_workspace(owner_headers)

    member = invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=member_headers,
        organization_ref=workspace["public_id"],
        email="remaining-remove-member@example.com",
    )

    response = client.delete(
        f"/organizations/{workspace['public_id']}/members/{member['id']}",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    removed_member_response = client.get(
        f"/organizations/{workspace['public_id']}/members",
        headers=member_headers,
    )

    assert removed_member_response.status_code == status.HTTP_404_NOT_FOUND
    assert removed_member_response.json()["error"]["code"] == "not_found"


def test_ownership_can_be_transferred_by_workspace_public_id():
    owner_headers = register_and_login("remaining-transfer-owner@example.com")
    new_owner_headers = register_and_login("remaining-transfer-new-owner@example.com")
    workspace = create_workspace(owner_headers)

    new_owner_member = invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=new_owner_headers,
        organization_ref=workspace["public_id"],
        email="remaining-transfer-new-owner@example.com",
    )

    response = client.post(
        f"/organizations/{workspace['public_id']}/members/{new_owner_member['id']}/transfer-ownership",
        headers=owner_headers,
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    members_response = client.get(
        f"/organizations/{workspace['public_id']}/members",
        headers=new_owner_headers,
    )

    assert members_response.status_code == status.HTTP_200_OK

    members_by_email = {
        member["email"]: member
        for member in members_response.json()
    }

    assert members_by_email["remaining-transfer-owner@example.com"]["role"] == "member"
    assert members_by_email["remaining-transfer-new-owner@example.com"]["role"] == "owner"


def test_member_can_leave_workspace_by_public_id():
    owner_headers = register_and_login("remaining-leave-owner@example.com")
    member_headers = register_and_login("remaining-leave-member@example.com")
    workspace = create_workspace(owner_headers)

    invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=member_headers,
        organization_ref=workspace["public_id"],
        email="remaining-leave-member@example.com",
    )

    response = client.delete(
        f"/organizations/{workspace['public_id']}/membership",
        headers=member_headers,
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    members_response = client.get(
        f"/organizations/{workspace['public_id']}/members",
        headers=member_headers,
    )

    assert members_response.status_code == status.HTTP_404_NOT_FOUND
    assert members_response.json()["error"]["code"] == "not_found"


def test_non_member_gets_not_found_for_workspace_public_id_members():
    owner_headers = register_and_login("remaining-private-owner@example.com")
    other_headers = register_and_login("remaining-private-other@example.com")
    workspace = create_workspace(owner_headers)

    response = client.get(
        f"/organizations/{workspace['public_id']}/members",
        headers=other_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"
