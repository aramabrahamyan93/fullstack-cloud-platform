from fastapi.testclient import TestClient

from app.db.database import Base
from app.db.database import engine
from app.main import app


client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_list_tasks_returns_empty_list_initially():
    response = client.get("/tasks")

    assert response.status_code == 200
    assert response.json() == []


def test_create_task_returns_created_task():
    response = client.post(
        "/tasks",
        json={
            "title": "Test task",
            "status": "open",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == 1
    assert data["title"] == "Test task"
    assert data["status"] == "open"


def test_list_tasks_returns_created_task():
    create_response = client.post(
        "/tasks",
        json={
            "title": "Test task",
            "status": "open",
        },
    )

    assert create_response.status_code == 200

    list_response = client.get("/tasks")

    assert list_response.status_code == 200

    data = list_response.json()

    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["title"] == "Test task"
    assert data[0]["status"] == "open"


def test_create_task_rejects_empty_title():
    response = client.post(
        "/tasks",
        json={
            "title": "",
            "status": "open",
        },
    )

    assert response.status_code == 422


def test_create_task_rejects_invalid_status():
    response = client.post(
        "/tasks",
        json={
            "title": "Test task",
            "status": "invalid",
        },
    )

    assert response.status_code == 422


def test_create_task_accepts_all_supported_statuses():
    supported_statuses = ["open", "in_progress", "done"]

    for status in supported_statuses:
        response = client.post(
            "/tasks",
            json={
                "title": f"Task with status {status}",
                "status": status,
            },
        )

        assert response.status_code == 200
        assert response.json()["status"] == status