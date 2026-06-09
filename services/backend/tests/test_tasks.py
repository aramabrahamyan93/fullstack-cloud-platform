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
    assert response.json() == {
        "error": {
            "code": "task_not_found",
            "message": f"Task with id={task_id} was not found.",
        }
    }


def register_and_login(
    email: str = "user@example.com",
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

    token = login_response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}",
    }


def create_task(
    headers: dict[str, str],
    title: str = "Test task",
    task_status: str = "open",
):
    return client.post(
        "/tasks",
        headers=headers,
        json={
            "title": title,
            "status": task_status,
        },
    )


def test_list_tasks_requires_authentication():
    response = client.get("/tasks")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_create_task_requires_authentication():
    response = client.post(
        "/tasks",
        json={
            "title": "Test task",
            "status": "open",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_task_requires_authentication():
    response = client.get("/tasks/1")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_update_task_requires_authentication():
    response = client.put(
        "/tasks/1",
        json={
            "title": "Updated title",
            "status": "done",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_delete_task_requires_authentication():
    response = client.delete("/tasks/1")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_list_tasks_returns_empty_list_initially():
    headers = register_and_login()

    response = client.get("/tasks", headers=headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_create_task_returns_created_task():
    headers = register_and_login()

    response = create_task(headers=headers)

    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()

    assert data["id"] == 1
    assert data["title"] == "Test task"
    assert data["status"] == "open"


def test_list_tasks_returns_created_task():
    headers = register_and_login()

    create_response = create_task(headers=headers)

    assert create_response.status_code == status.HTTP_201_CREATED

    list_response = client.get("/tasks", headers=headers)

    assert list_response.status_code == status.HTTP_200_OK

    data = list_response.json()

    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["title"] == "Test task"
    assert data[0]["status"] == "open"


def test_get_task_returns_existing_task():
    headers = register_and_login()

    create_response = create_task(
        headers=headers,
        title="Find me",
        task_status="in_progress",
    )

    task_id = create_response.json()["id"]

    response = client.get(f"/tasks/{task_id}", headers=headers)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert data["id"] == task_id
    assert data["title"] == "Find me"
    assert data["status"] == "in_progress"


def test_get_task_returns_404_when_task_does_not_exist():
    headers = register_and_login()

    response = client.get("/tasks/999", headers=headers)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert_task_not_found(response, 999)


def test_update_task_updates_existing_task():
    headers = register_and_login()

    create_response = create_task(
        headers=headers,
        title="Old title",
        task_status="open",
    )

    task_id = create_response.json()["id"]

    response = client.put(
        f"/tasks/{task_id}",
        headers=headers,
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
    headers = register_and_login()

    response = client.put(
        "/tasks/999",
        headers=headers,
        json={
            "title": "Updated title",
            "status": "done",
        },
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert_task_not_found(response, 999)


def test_update_task_rejects_empty_title():
    headers = register_and_login()

    create_response = create_task(headers=headers)
    task_id = create_response.json()["id"]

    response = client.put(
        f"/tasks/{task_id}",
        headers=headers,
        json={
            "title": "",
            "status": "done",
        },
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_update_task_rejects_invalid_status():
    headers = register_and_login()

    create_response = create_task(headers=headers)
    task_id = create_response.json()["id"]

    response = client.put(
        f"/tasks/{task_id}",
        headers=headers,
        json={
            "title": "Updated title",
            "status": "invalid",
        },
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_delete_task_deletes_existing_task():
    headers = register_and_login()

    create_response = create_task(headers=headers)
    task_id = create_response.json()["id"]

    delete_response = client.delete(f"/tasks/{task_id}", headers=headers)

    assert delete_response.status_code == status.HTTP_204_NO_CONTENT
    assert delete_response.text == ""

    get_response = client.get(f"/tasks/{task_id}", headers=headers)

    assert get_response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_task_returns_404_when_task_does_not_exist():
    headers = register_and_login()

    response = client.delete("/tasks/999", headers=headers)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert_task_not_found(response, 999)


def test_create_task_rejects_empty_title():
    headers = register_and_login()

    response = create_task(headers=headers, title="")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_task_rejects_invalid_status():
    headers = register_and_login()

    response = create_task(headers=headers, task_status="invalid")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_task_accepts_all_supported_statuses():
    headers = register_and_login()
    supported_statuses = ["open", "in_progress", "done"]

    for task_status in supported_statuses:
        response = create_task(
            headers=headers,
            title=f"Task with status {task_status}",
            task_status=task_status,
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["status"] == task_status


def test_user_cannot_list_other_users_tasks():
    user_a_headers = register_and_login(email="user-a@example.com")
    user_b_headers = register_and_login(email="user-b@example.com")

    create_task(
        headers=user_a_headers,
        title="User A task",
        task_status="open",
    )

    response = client.get("/tasks", headers=user_b_headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_user_cannot_get_other_users_task():
    user_a_headers = register_and_login(email="user-a@example.com")
    user_b_headers = register_and_login(email="user-b@example.com")

    create_response = create_task(
        headers=user_a_headers,
        title="User A task",
        task_status="open",
    )

    task_id = create_response.json()["id"]

    response = client.get(f"/tasks/{task_id}", headers=user_b_headers)

    assert_task_not_found(response, task_id)


def test_user_cannot_update_other_users_task():
    user_a_headers = register_and_login(email="user-a@example.com")
    user_b_headers = register_and_login(email="user-b@example.com")

    create_response = create_task(
        headers=user_a_headers,
        title="User A task",
        task_status="open",
    )

    task_id = create_response.json()["id"]

    response = client.put(
        f"/tasks/{task_id}",
        headers=user_b_headers,
        json={
            "title": "Hacked title",
            "status": "done",
        },
    )

    assert_task_not_found(response, task_id)


def test_user_cannot_delete_other_users_task():
    user_a_headers = register_and_login(email="user-a@example.com")
    user_b_headers = register_and_login(email="user-b@example.com")

    create_response = create_task(
        headers=user_a_headers,
        title="User A task",
        task_status="open",
    )

    task_id = create_response.json()["id"]

    response = client.delete(f"/tasks/{task_id}", headers=user_b_headers)

    assert_task_not_found(response, task_id)

    owner_response = client.get(f"/tasks/{task_id}", headers=user_a_headers)

    assert owner_response.status_code == status.HTTP_200_OK

def test_list_tasks_can_filter_by_open_status():
    headers = register_and_login()

    create_task(headers=headers, title="Open task", task_status="open")
    create_task(headers=headers, title="In progress task", task_status="in_progress")
    create_task(headers=headers, title="Done task", task_status="done")

    response = client.get("/tasks?status=open", headers=headers)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 1
    assert data[0]["title"] == "Open task"
    assert data[0]["status"] == "open"


def test_list_tasks_can_filter_by_in_progress_status():
    headers = register_and_login()

    create_task(headers=headers, title="Open task", task_status="open")
    create_task(headers=headers, title="In progress task", task_status="in_progress")
    create_task(headers=headers, title="Done task", task_status="done")

    response = client.get("/tasks?status=in_progress", headers=headers)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 1
    assert data[0]["title"] == "In progress task"
    assert data[0]["status"] == "in_progress"


def test_list_tasks_can_filter_by_done_status():
    headers = register_and_login()

    create_task(headers=headers, title="Open task", task_status="open")
    create_task(headers=headers, title="In progress task", task_status="in_progress")
    create_task(headers=headers, title="Done task", task_status="done")

    response = client.get("/tasks?status=done", headers=headers)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 1
    assert data[0]["title"] == "Done task"
    assert data[0]["status"] == "done"


def test_list_tasks_status_filter_keeps_user_ownership_scope():
    user_a_headers = register_and_login(email="user-a@example.com")
    user_b_headers = register_and_login(email="user-b@example.com")

    create_task(headers=user_a_headers, title="User A open task", task_status="open")
    create_task(headers=user_b_headers, title="User B open task", task_status="open")
    create_task(headers=user_b_headers, title="User B done task", task_status="done")

    response = client.get("/tasks?status=open", headers=user_b_headers)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 1
    assert data[0]["title"] == "User B open task"
    assert data[0]["status"] == "open"


def test_list_tasks_rejects_invalid_status_filter():
    headers = register_and_login()

    response = client.get("/tasks?status=invalid", headers=headers)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY