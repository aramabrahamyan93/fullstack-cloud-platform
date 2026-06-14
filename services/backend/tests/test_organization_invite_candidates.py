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
    name: str = "Invite Candidates Workspace",
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
    email: str,
):
    response = client.post(
        f"/organizations/{organization_id}/invitations",
        headers=headers,
        json={
            "email": email,
            "role": "member",
        },
    )

    assert response.status_code == status.HTTP_201_CREATED

    return response.json()


def test_owner_can_search_registered_invite_candidates():
    owner_headers = register_and_login("candidate-owner@example.com")
    register_and_login("candidate-user@example.com")

    organization = create_organization(headers=owner_headers)

    response = client.get(
        f"/organizations/{organization['id']}/invite-candidates",
        headers=owner_headers,
        params={"query": "candidate-user"},
    )

    assert response.status_code == status.HTTP_200_OK

    candidates = response.json()

    assert len(candidates) == 1
    assert candidates[0]["email"] == "candidate-user@example.com"
    assert candidates[0]["membership_status"] == "not_member"
    assert candidates[0]["invitation_status"] is None


def test_invite_candidates_marks_pending_invitation():
    owner_headers = register_and_login("candidate-pending-owner@example.com")
    register_and_login("candidate-pending-user@example.com")

    organization = create_organization(headers=owner_headers)

    create_invitation(
        headers=owner_headers,
        organization_id=organization["id"],
        email="candidate-pending-user@example.com",
    )

    response = client.get(
        f"/organizations/{organization['id']}/invite-candidates",
        headers=owner_headers,
        params={"query": "candidate-pending-user"},
    )

    assert response.status_code == status.HTTP_200_OK

    candidates = response.json()

    assert len(candidates) == 1
    assert candidates[0]["email"] == "candidate-pending-user@example.com"
    assert candidates[0]["membership_status"] == "not_member"
    assert candidates[0]["invitation_status"] == "pending"


def test_invite_candidates_marks_existing_member():
    owner_headers = register_and_login("candidate-member-owner@example.com")
    register_and_login("candidate-member-user@example.com")

    organization = create_organization(headers=owner_headers)

    add_member_response = client.post(
        f"/organizations/{organization['id']}/members",
        headers=owner_headers,
        json={
            "email": "candidate-member-user@example.com",
            "role": "member",
        },
    )
    assert add_member_response.status_code == status.HTTP_201_CREATED

    response = client.get(
        f"/organizations/{organization['id']}/invite-candidates",
        headers=owner_headers,
        params={"query": "candidate-member-user"},
    )

    assert response.status_code == status.HTTP_200_OK

    candidates = response.json()

    assert len(candidates) == 1
    assert candidates[0]["email"] == "candidate-member-user@example.com"
    assert candidates[0]["membership_status"] == "member"
    assert candidates[0]["invitation_status"] is None


def test_invite_candidates_requires_owner():
    owner_headers = register_and_login("candidate-private-owner@example.com")
    other_headers = register_and_login("candidate-private-other@example.com")
    register_and_login("candidate-private-user@example.com")

    organization = create_organization(headers=owner_headers)

    response = client.get(
        f"/organizations/{organization['id']}/invite-candidates",
        headers=other_headers,
        params={"query": "candidate-private-user"},
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["code"] == "not_found"


def test_invite_candidates_returns_empty_for_short_query():
    owner_headers = register_and_login("candidate-short-owner@example.com")
    register_and_login("candidate-short-user@example.com")

    organization = create_organization(headers=owner_headers)

    response = client.get(
        f"/organizations/{organization['id']}/invite-candidates",
        headers=owner_headers,
        params={"query": "c"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []
