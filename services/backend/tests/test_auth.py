from fastapi import status
from fastapi.testclient import TestClient

from app.db.database import Base
from app.db.database import engine
from app.main import app


client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_register_user_successfully():
    response = client.post(
        "/auth/register",
        json={
            "email": "user@example.com",
            "password": "strong-password",
        },
    )

    assert response.status_code == status.HTTP_201_CREATED

    body = response.json()

    assert body["id"] is not None
    assert body["email"] == "user@example.com"
    assert body["is_active"] is True
    assert "hashed_password" not in body
    assert "password" not in body


def test_register_duplicate_email_returns_conflict():
    payload = {
        "email": "user@example.com",
        "password": "strong-password",
    }

    first_response = client.post("/auth/register", json=payload)
    second_response = client.post("/auth/register", json=payload)

    assert first_response.status_code == status.HTTP_201_CREATED
    assert second_response.status_code == status.HTTP_409_CONFLICT


def test_login_returns_access_token():
    client.post(
        "/auth/register",
        json={
            "email": "user@example.com",
            "password": "strong-password",
        },
    )

    response = client.post(
        "/auth/login",
        json={
            "email": "user@example.com",
            "password": "strong-password",
        },
    )

    assert response.status_code == status.HTTP_200_OK

    body = response.json()

    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_login_with_wrong_password_returns_unauthorized():
    client.post(
        "/auth/register",
        json={
            "email": "user@example.com",
            "password": "strong-password",
        },
    )

    response = client.post(
        "/auth/login",
        json={
            "email": "user@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_me_returns_current_user():
    client.post(
        "/auth/register",
        json={
            "email": "user@example.com",
            "password": "strong-password",
        },
    )

    login_response = client.post(
        "/auth/login",
        json={
            "email": "user@example.com",
            "password": "strong-password",
        },
    )

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