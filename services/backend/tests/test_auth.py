from datetime import datetime
from datetime import timedelta
from datetime import timezone

from fastapi import status
from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.db.database import Base
from app.db.database import engine
from app.main import app


client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def register_user(
    email: str = "user@example.com",
    password: str = "strong-password",
):
    return client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
        },
    )


def login_user(
    email: str = "user@example.com",
    password: str = "strong-password",
):
    return client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )


def create_test_token(payload: dict) -> str:
    return jwt.encode(
        payload,
        settings.auth_secret_key,
        algorithm=settings.auth_algorithm,
    )


def test_register_user_successfully():
    response = register_user()

    assert response.status_code == status.HTTP_201_CREATED

    body = response.json()

    assert body["id"] is not None
    assert body["email"] == "user@example.com"
    assert body["is_active"] is True
    assert "hashed_password" not in body
    assert "password" not in body


def test_register_duplicate_email_returns_conflict():
    first_response = register_user()
    second_response = register_user()

    assert first_response.status_code == status.HTTP_201_CREATED
    assert second_response.status_code == status.HTTP_409_CONFLICT
    assert second_response.json()["error"]["code"] == "conflict"


def test_login_returns_access_token():
    register_user()

    response = login_user()

    assert response.status_code == status.HTTP_200_OK

    body = response.json()

    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_login_with_wrong_password_returns_unauthorized():
    register_user()

    response = login_user(password="wrong-password")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["error"]["code"] == "unauthorized"


def test_me_returns_current_user():
    register_user()
    login_response = login_user()

    token = login_response.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == status.HTTP_200_OK

    body = response.json()

    assert body["email"] == "user@example.com"
    assert body["is_active"] is True


def test_me_without_token_returns_unauthorized():
    response = client.get("/auth/me")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["error"]["code"] == "unauthorized"


def test_me_with_invalid_token_returns_unauthorized():
    response = client.get(
        "/auth/me",
        headers={
            "Authorization": "Bearer invalid-token",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["error"]["code"] == "unauthorized"


def test_me_with_expired_token_returns_unauthorized():
    token = create_test_token(
        {
            "sub": "1",
            "type": "access",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        }
    )

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["error"]["code"] == "unauthorized"


def test_me_with_non_numeric_subject_returns_unauthorized():
    token = create_test_token(
        {
            "sub": "not-a-number",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        }
    )

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["error"]["code"] == "unauthorized"


def test_me_with_wrong_token_type_returns_unauthorized():
    token = create_test_token(
        {
            "sub": "1",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        }
    )

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["error"]["code"] == "unauthorized"