from fastapi import status
from fastapi.testclient import TestClient

from app.db.database import Base
from app.db.database import engine
from app.main import app


client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def assert_task_not_found(response, task_id: int):
    assert response.status_code == status.HTTP_404_NOT_FOUND

    error = response.json()["error"]

    assert error["code"] == "task_not_found"
    assert error["message"] == f"Task with id={task_id} was not found."
    assert "requestId" in error
    assert error["requestId"]


def create_task(
    title: str = "Test task",
    task_status: str = "open",
):
    return client.post(
        "/tasks",
        json={
            "title": title,
            "status": task_status,
        },
    )


def test_list_tasks_returns_empty_list_initially():
    response = client.get("/tasks")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_create_task_returns_created_task():
    response = create_task()

    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()

    assert data["id"] == 1
    assert data["title"] == "Test task"
    assert data["status"] == "open"


def test_list_tasks_returns_created_task():
    create_response = create_task()

    assert create_response.status_code == status.HTTP_201_CREATED

    list_response = client.get("/tasks")

    assert list_response.status_code == status.HTTP_200_OK

    data = list_response.json()

    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["title"] == "Test task"
    assert data[0]["status"] == "open"


def test_get_task_returns_existing_task():
    create_response = create_task(
        title="Find me",
        task_status="in_progress",
    )

    task_id = create_response.json()["id"]

    response = client.get(f"/tasks/{task_id}")

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert data["id"] == task_id
    assert data["title"] == "Find me"
    assert data["status"] == "in_progress"


def test_get_task_returns_404_when_task_does_not_exist():
    response = client.get("/tasks/999")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert_task_not_found(response, 999)


def test_update_task_updates_existing_task():
    create_response = create_task(
        title="Old title",
        task_status="open",
    )

    task_id = create_response.json()["id"]

    response = client.put(
        f"/tasks/{task_id}",
        json={
            "title": "Updated title",
            "status": "done",
        },
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert data["id"] == task_id
    assert data["title"] == "Updated title"
    assert data["status"] == "done"


def test_update_task_returns_404_when_task_does_not_exist():
    response = client.put(
        "/tasks/999",
        json={
            "title": "Updated title",
            "status": "done",
        },
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert_task_not_found(response, 999)


def test_update_task_rejects_empty_title():
    create_response = create_task()
    task_id = create_response.json()["id"]

    response = client.put(
        f"/tasks/{task_id}",
        json={
            "title": "",
            "status": "done",
        },
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_update_task_rejects_invalid_status():
    create_response = create_task()
    task_id = create_response.json()["id"]

    response = client.put(
        f"/tasks/{task_id}",
        json={
            "title": "Updated title",
            "status": "invalid",
        },
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_delete_task_deletes_existing_task():
    create_response = create_task()
    task_id = create_response.json()["id"]

    delete_response = client.delete(f"/tasks/{task_id}")

    assert delete_response.status_code == status.HTTP_204_NO_CONTENT
    assert delete_response.text == ""

    get_response = client.get(f"/tasks/{task_id}")

    assert get_response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_task_returns_404_when_task_does_not_exist():
    response = client.delete("/tasks/999")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert_task_not_found(response, 999)


def test_create_task_rejects_empty_title():
    response = create_task(title="")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_task_rejects_invalid_status():
    response = create_task(task_status="invalid")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_task_accepts_all_supported_statuses():
    supported_statuses = ["open", "in_progress", "done"]

    for task_status in supported_statuses:
        response = create_task(
            title=f"Task with status {task_status}",
            task_status=task_status,
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["status"] == task_status