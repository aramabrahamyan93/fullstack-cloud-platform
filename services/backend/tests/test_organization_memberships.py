import pytest
from fastapi.testclient import TestClient

from app.core.errors import ForbiddenError, NotFoundError
from app.db.dependencies import get_db
from app.features.organizations.repository import create_organization_member
from app.features.organizations.schemas import OrganizationCreate
from app.features.organizations.service import (
    create_user_organization,
    ensure_user_is_organization_member,
    ensure_user_is_organization_owner,
)
from app.features.users.models import User
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def register_and_get_user(
    client: TestClient,
    *,
    email: str,
    password: str = "strong-password",
) -> User:
    register_response = client.post(
        "/auth/register",
        json={"email": email, "password": password},
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    me_response = client.get(
        "/auth/me",
        headers=auth_headers(token),
    )
    assert me_response.status_code == 200

    user_data = me_response.json()

    return User(
        id=user_data["id"],
        email=user_data["email"],
        hashed_password="",
    )


def test_organization_creator_is_member_and_owner(client: TestClient) -> None:
    db = next(get_db())
    try:
        user = register_and_get_user(
            client,
            email="membership-owner@example.com",
        )

        organization = create_user_organization(
            db,
            current_user=user,
            organization_create=OrganizationCreate(name="Membership Workspace"),
        )

        membership = ensure_user_is_organization_member(
            db,
            organization_id=organization.id,
            current_user=user,
        )

        assert membership.organization_id == organization.id
        assert membership.user_id == user.id
        assert membership.role == "owner"

        owner_membership = ensure_user_is_organization_owner(
            db,
            organization_id=organization.id,
            current_user=user,
        )

        assert owner_membership.id == membership.id
    finally:
        db.close()


def test_non_member_cannot_access_membership(client: TestClient) -> None:
    db = next(get_db())
    try:
        owner = register_and_get_user(
            client,
            email="membership-owner-2@example.com",
        )
        other_user = register_and_get_user(
            client,
            email="membership-other@example.com",
        )

        organization = create_user_organization(
            db,
            current_user=owner,
            organization_create=OrganizationCreate(name="Private Membership Workspace"),
        )

        with pytest.raises(NotFoundError):
            ensure_user_is_organization_member(
                db,
                organization_id=organization.id,
                current_user=other_user,
            )
    finally:
        db.close()


def test_non_owner_member_cannot_pass_owner_check(client: TestClient) -> None:
    db = next(get_db())
    try:
        owner = register_and_get_user(
            client,
            email="membership-owner-3@example.com",
        )
        member = register_and_get_user(
            client,
            email="membership-member@example.com",
        )

        organization = create_user_organization(
            db,
            current_user=owner,
            organization_create=OrganizationCreate(name="Owner Check Workspace"),
        )

        create_organization_member(
            db,
            organization_id=organization.id,
            user_id=member.id,
            role="member",
        )
        db.commit()

        with pytest.raises(ForbiddenError):
            ensure_user_is_organization_owner(
                db,
                organization_id=organization.id,
                current_user=member,
            )
    finally:
        db.close()
