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
    name: str = "Ownership Transfer Workspace",
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


def add_member(
    headers: dict[str, str],
    organization_id: int,
    email: str,
) -> dict:
    response = client.post(
        f"/organizations/{organization_id}/members",
        headers=headers,
        json={
            "email": email,
            "role": "member",
        },
    )

    assert response.status_code == status.HTTP_201_CREATED

    return response.json()


def list_members(
    headers: dict[str, str],
    organization_id: int,
):
    return client.get(
        f"/organizations/{organization_id}/members",
        headers=headers,
    )


def transfer_ownership(
    headers: dict[str, str],
    organization_id: int,
    member_id: int,
):
    return client.post(
        f"/organizations/{organization_id}/members/{member_id}/transfer-ownership",
        headers=headers,
    )


def test_owner_can_transfer_ownership_to_member():
    owner_headers = register_and_login("transfer-owner@example.com")
    new_owner_headers = register_and_login("transfer-new-owner@example.com")

    organization = create_organization(headers=owner_headers)
    new_owner_member = add_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="transfer-new-owner@example.com",
    )

    response = transfer_ownership(
        headers=owner_headers,
        organization_id=organization["id"],
        member_id=new_owner_member["id"],
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    members_response = list_members(
        headers=new_owner_headers,
        organization_id=organization["id"],
    )
    assert members_response.status_code == status.HTTP_200_OK

    members_by_email = {
        workspace_member["email"]: workspace_member
        for workspace_member in members_response.json()
    }

    assert members_by_email["transfer-owner@example.com"]["role"] == "member"
    assert members_by_email["transfer-new-owner@example.com"]["role"] == "owner"


def test_new_owner_can_manage_members_after_transfer():
    owner_headers = register_and_login("transfer-manage-owner@example.com")
    new_owner_headers = register_and_login("transfer-manage-new-owner@example.com")
    register_and_login("transfer-manage-target@example.com")

    organization = create_organization(headers=owner_headers)
    new_owner_member = add_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="transfer-manage-new-owner@example.com",
    )

    response = transfer_ownership(
        headers=owner_headers,
        organization_id=organization["id"],
        member_id=new_owner_member["id"],
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    add_response = client.post(
        f"/organizations/{organization['id']}/members",
        headers=new_owner_headers,
        json={
            "email": "transfer-manage-target@example.com",
            "role": "member",
        },
    )

    assert add_response.status_code == status.HTTP_201_CREATED


def test_old_owner_can_no_longer_manage_members_after_transfer():
    owner_headers = register_and_login("transfer-old-owner@example.com")
    register_and_login("transfer-old-new-owner@example.com")
    register_and_login("transfer-old-target@example.com")

    organization = create_organization(headers=owner_headers)
    new_owner_member = add_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="transfer-old-new-owner@example.com",
    )

    response = transfer_ownership(
        headers=owner_headers,
        organization_id=organization["id"],
        member_id=new_owner_member["id"],
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    add_response = client.post(
        f"/organizations/{organization['id']}/members",
        headers=owner_headers,
        json={
            "email": "transfer-old-target@example.com",
            "role": "member",
        },
    )

    assert add_response.status_code == status.HTTP_403_FORBIDDEN
    assert add_response.json()["error"]["code"] == "forbidden"


def test_non_owner_cannot_transfer_ownership():
    owner_headers = register_and_login("transfer-private-owner@example.com")
    member_headers = register_and_login("transfer-private-member@example.com")
    register_and_login("transfer-private-target@example.com")

    organization = create_organization(headers=owner_headers)
    add_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="transfer-private-member@example.com",
    )
    target_member = add_member(
        headers=owner_headers,
        organization_id=organization["id"],
        email="transfer-private-target@example.com",
    )

    response = transfer_ownership(
        headers=member_headers,
        organization_id=organization["id"],
        member_id=target_member["id"],
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "forbidden"


def test_owner_cannot_transfer_ownership_to_missing_member():
    owner_headers = register_and_login("transfer-missing-owner@example.com")
    organization = create_organization(headers=owner_headers)

    response = transfer_ownership(
        headers=owner_headers,
        organization_id=organization["id"],
        member_id=999,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"


def test_owner_cannot_transfer_ownership_to_self():
    owner_headers = register_and_login("transfer-self-owner@example.com")
    organization = create_organization(headers=owner_headers)

    members_response = list_members(
        headers=owner_headers,
        organization_id=organization["id"],
    )
    assert members_response.status_code == status.HTTP_200_OK

    owner_member = members_response.json()[0]

    response = transfer_ownership(
        headers=owner_headers,
        organization_id=organization["id"],
        member_id=owner_member["id"],
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert (
        response.json()["error"]["code"]
        == "workspace_ownership_self_transfer_not_allowed"
    )


def test_transfer_ownership_requires_authentication():
    response = client.post("/organizations/1/members/1/transfer-ownership")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
