import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.db.database import Base
from app.db.database import engine
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def register_and_login(
    client: TestClient,
    *,
    email: str,
    password: str = "strong-password",
) -> str:
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

    return login_response.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_workspace(
    client: TestClient,
    *,
    token: str,
    name: str = "Original Workspace",
) -> dict:
    response = client.post(
        "/organizations",
        headers=auth_headers(token),
        json={"name": name},
    )
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()


def invite_and_accept_member(
    client: TestClient,
    *,
    owner_token: str,
    member_token: str,
    organization_id: int,
    member_email: str,
) -> None:
    invite_response = client.post(
        f"/organizations/{organization_id}/invitations",
        headers=auth_headers(owner_token),
        json={
            "email": member_email,
            "role": "member",
        },
    )
    assert invite_response.status_code == status.HTTP_201_CREATED

    invitation_id = invite_response.json()["id"]

    accept_response = client.post(
        f"/organizations/invitations/{invitation_id}/accept",
        headers=auth_headers(member_token),
    )
    assert accept_response.status_code == status.HTTP_200_OK


def test_rename_workspace_requires_authentication(client: TestClient) -> None:
    response = client.patch(
        "/organizations/1",
        json={"name": "Renamed Workspace"},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_owner_can_rename_workspace(client: TestClient) -> None:
    owner_token = register_and_login(client, email="rename-owner@example.com")
    workspace = create_workspace(client, token=owner_token)

    response = client.patch(
        f"/organizations/{workspace['id']}",
        headers=auth_headers(owner_token),
        json={"name": "Renamed Workspace"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "id": workspace["id"],
        "public_id": workspace["public_id"],
        "name": "Renamed Workspace",
        "role": "owner",
    }

    get_response = client.get(
        f"/organizations/{workspace['id']}",
        headers=auth_headers(owner_token),
    )
    assert get_response.status_code == status.HTTP_200_OK
    assert get_response.json()["name"] == "Renamed Workspace"

    list_response = client.get(
        "/organizations",
        headers=auth_headers(owner_token),
    )
    assert list_response.status_code == status.HTTP_200_OK
    assert list_response.json()[0]["name"] == "Renamed Workspace"


def test_member_cannot_rename_workspace(client: TestClient) -> None:
    owner_token = register_and_login(client, email="rename-owner-2@example.com")
    member_email = "rename-member@example.com"
    member_token = register_and_login(client, email=member_email)
    workspace = create_workspace(client, token=owner_token)

    invite_and_accept_member(
        client,
        owner_token=owner_token,
        member_token=member_token,
        organization_id=workspace["id"],
        member_email=member_email,
    )

    response = client.patch(
        f"/organizations/{workspace['id']}",
        headers=auth_headers(member_token),
        json={"name": "Member Rename Attempt"},
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_non_member_cannot_rename_workspace(client: TestClient) -> None:
    owner_token = register_and_login(client, email="rename-owner-3@example.com")
    other_token = register_and_login(client, email="rename-other@example.com")
    workspace = create_workspace(client, token=owner_token)

    response = client.patch(
        f"/organizations/{workspace['id']}",
        headers=auth_headers(other_token),
        json={"name": "Other Rename Attempt"},
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_rename_workspace_validates_name(client: TestClient) -> None:
    owner_token = register_and_login(client, email="rename-owner-4@example.com")
    workspace = create_workspace(client, token=owner_token)

    response = client.patch(
        f"/organizations/{workspace['id']}",
        headers=auth_headers(owner_token),
        json={"name": ""},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
