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
    name: str = "Public Task Workspace",
) -> dict:
    response = client.post(
        "/organizations",
        headers=headers,
        json={"name": name},
    )
    assert response.status_code == status.HTTP_201_CREATED

    organization = response.json()
    assert organization["public_id"].startswith("ws_")

    return organization


def create_organization_task(
    *,
    headers: dict[str, str],
    organization_ref: int | str,
    title: str = "Organization task",
    task_status: str = "open",
):
    return client.post(
        f"/organizations/{organization_ref}/tasks",
        headers=headers,
        json={
            "title": title,
            "status": task_status,
        },
    )


def test_workspace_task_collection_routes_accept_public_id():
    headers = register_and_login("workspace-task-public-owner@example.com")
    organization = create_organization(headers=headers)
    organization_ref = organization["public_id"]

    first_create_response = create_organization_task(
        headers=headers,
        organization_ref=organization_ref,
        title="Public Alpha task",
        task_status="open",
    )
    assert first_create_response.status_code == status.HTTP_201_CREATED

    second_create_response = create_organization_task(
        headers=headers,
        organization_ref=organization_ref,
        title="Public Beta task",
        task_status="done",
    )
    assert second_create_response.status_code == status.HTTP_201_CREATED

    list_response = client.get(
        f"/organizations/{organization_ref}/tasks",
        headers=headers,
    )
    assert list_response.status_code == status.HTTP_200_OK
    assert len(list_response.json()) == 2

    paginated_response = client.get(
        (
            f"/organizations/{organization_ref}/tasks/paginated"
            "?status=open&search=Alpha&limit=10&offset=0"
        ),
        headers=headers,
    )
    assert paginated_response.status_code == status.HTTP_200_OK

    paginated_data = paginated_response.json()
    assert paginated_data["total"] == 1
    assert len(paginated_data["items"]) == 1
    assert paginated_data["items"][0]["title"] == "Public Alpha task"

    stats_response = client.get(
        f"/organizations/{organization_ref}/tasks/stats",
        headers=headers,
    )
    assert stats_response.status_code == status.HTTP_200_OK
    assert stats_response.json() == {
        "all": 2,
        "open": 1,
        "in_progress": 0,
        "done": 1,
    }


def test_workspace_task_item_routes_accept_public_id():
    headers = register_and_login("workspace-task-public-crud@example.com")
    organization = create_organization(headers=headers)
    organization_ref = organization["public_id"]

    create_response = create_organization_task(
        headers=headers,
        organization_ref=organization_ref,
        title="Original public task",
        task_status="open",
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    task_id = create_response.json()["id"]

    get_response = client.get(
        f"/organizations/{organization_ref}/tasks/{task_id}",
        headers=headers,
    )
    assert get_response.status_code == status.HTTP_200_OK
    assert get_response.json()["title"] == "Original public task"

    update_response = client.put(
        f"/organizations/{organization_ref}/tasks/{task_id}",
        headers=headers,
        json={
            "title": "Updated public task",
            "status": "done",
        },
    )
    assert update_response.status_code == status.HTTP_200_OK
    assert update_response.json()["title"] == "Updated public task"
    assert update_response.json()["status"] == "done"

    delete_response = client.delete(
        f"/organizations/{organization_ref}/tasks/{task_id}",
        headers=headers,
    )
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT

    get_after_delete_response = client.get(
        f"/organizations/{organization_ref}/tasks/{task_id}",
        headers=headers,
    )
    assert get_after_delete_response.status_code == status.HTTP_404_NOT_FOUND
    assert get_after_delete_response.json()["error"]["code"] == "task_not_found"


def test_non_member_cannot_access_workspace_tasks_by_public_id():
    owner_headers = register_and_login("workspace-task-public-owner-2@example.com")
    other_headers = register_and_login("workspace-task-public-other@example.com")
    organization = create_organization(headers=owner_headers)
    organization_ref = organization["public_id"]

    create_response = create_organization_task(
        headers=owner_headers,
        organization_ref=organization_ref,
        title="Private public-id task",
    )
    assert create_response.status_code == status.HTTP_201_CREATED

    list_response = client.get(
        f"/organizations/{organization_ref}/tasks",
        headers=other_headers,
    )
    assert list_response.status_code == status.HTTP_404_NOT_FOUND

    create_other_response = create_organization_task(
        headers=other_headers,
        organization_ref=organization_ref,
        title="Should not be created",
    )
    assert create_other_response.status_code == status.HTTP_404_NOT_FOUND


def test_legacy_numeric_workspace_task_routes_still_work():
    headers = register_and_login("workspace-task-legacy-owner@example.com")
    organization = create_organization(headers=headers)
    organization_ref = organization["id"]

    create_response = create_organization_task(
        headers=headers,
        organization_ref=organization_ref,
        title="Legacy numeric task",
        task_status="in_progress",
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    task_id = create_response.json()["id"]

    get_response = client.get(
        f"/organizations/{organization_ref}/tasks/{task_id}",
        headers=headers,
    )
    assert get_response.status_code == status.HTTP_200_OK
    assert get_response.json()["title"] == "Legacy numeric task"
    assert get_response.json()["status"] == "in_progress"
