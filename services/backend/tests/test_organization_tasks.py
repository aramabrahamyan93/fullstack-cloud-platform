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
    name: str = "Task Workspace",
) -> dict:
    response = client.post(
        "/organizations",
        headers=headers,
        json={"name": name},
    )
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()


def create_organization_task(
    headers: dict[str, str],
    organization_id: int,
    title: str = "Organization task",
    task_status: str = "open",
):
    return client.post(
        f"/organizations/{organization_id}/tasks",
        headers=headers,
        json={
            "title": title,
            "status": task_status,
        },
    )


def assert_task_not_found(response, task_id: int):
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "error": {
            "code": "task_not_found",
            "message": f"Task with id={task_id} was not found.",
        }
    }


def test_create_organization_task_requires_authentication():
    response = client.post(
        "/organizations/1/tasks",
        json={
            "title": "Task",
            "status": "open",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_list_organization_tasks_requires_authentication():
    response = client.get("/organizations/1/tasks")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_create_and_list_organization_task():
    headers = register_and_login("organization-task-owner@example.com")
    organization = create_organization(headers=headers)

    create_response = create_organization_task(
        headers=headers,
        organization_id=organization["id"],
        title="First organization task",
        task_status="in_progress",
    )

    assert create_response.status_code == status.HTTP_201_CREATED

    created_task = create_response.json()
    assert created_task["id"] == 1
    assert created_task["title"] == "First organization task"
    assert created_task["status"] == "in_progress"

    list_response = client.get(
        f"/organizations/{organization['id']}/tasks",
        headers=headers,
    )

    assert list_response.status_code == status.HTTP_200_OK
    assert list_response.json() == [created_task]


def test_get_update_and_delete_organization_task():
    headers = register_and_login("organization-task-crud@example.com")
    organization = create_organization(headers=headers)

    create_response = create_organization_task(
        headers=headers,
        organization_id=organization["id"],
        title="Original task",
        task_status="open",
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    task_id = create_response.json()["id"]

    get_response = client.get(
        f"/organizations/{organization['id']}/tasks/{task_id}",
        headers=headers,
    )
    assert get_response.status_code == status.HTTP_200_OK
    assert get_response.json()["title"] == "Original task"

    update_response = client.put(
        f"/organizations/{organization['id']}/tasks/{task_id}",
        headers=headers,
        json={
            "title": "Updated task",
            "status": "done",
        },
    )
    assert update_response.status_code == status.HTTP_200_OK
    assert update_response.json()["title"] == "Updated task"
    assert update_response.json()["status"] == "done"

    delete_response = client.delete(
        f"/organizations/{organization['id']}/tasks/{task_id}",
        headers=headers,
    )
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT
    assert delete_response.text == ""

    get_after_delete_response = client.get(
        f"/organizations/{organization['id']}/tasks/{task_id}",
        headers=headers,
    )
    assert_task_not_found(get_after_delete_response, task_id)


def test_non_member_cannot_access_organization_tasks():
    owner_headers = register_and_login("organization-task-owner-2@example.com")
    other_headers = register_and_login("organization-task-other@example.com")
    organization = create_organization(headers=owner_headers)

    create_response = create_organization_task(
        headers=owner_headers,
        organization_id=organization["id"],
        title="Private organization task",
    )
    assert create_response.status_code == status.HTTP_201_CREATED

    list_response = client.get(
        f"/organizations/{organization['id']}/tasks",
        headers=other_headers,
    )
    assert list_response.status_code == status.HTTP_404_NOT_FOUND

    create_other_response = create_organization_task(
        headers=other_headers,
        organization_id=organization["id"],
        title="Should not be created",
    )
    assert create_other_response.status_code == status.HTTP_404_NOT_FOUND


def test_organization_task_stats_are_scoped():
    headers = register_and_login("organization-task-stats@example.com")
    first_organization = create_organization(headers=headers, name="First Workspace")
    second_organization = create_organization(headers=headers, name="Second Workspace")

    assert create_organization_task(
        headers=headers,
        organization_id=first_organization["id"],
        title="First open",
        task_status="open",
    ).status_code == status.HTTP_201_CREATED

    assert create_organization_task(
        headers=headers,
        organization_id=first_organization["id"],
        title="First done",
        task_status="done",
    ).status_code == status.HTTP_201_CREATED

    assert create_organization_task(
        headers=headers,
        organization_id=second_organization["id"],
        title="Second open",
        task_status="open",
    ).status_code == status.HTTP_201_CREATED

    response = client.get(
        f"/organizations/{first_organization['id']}/tasks/stats",
        headers=headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "all": 2,
        "open": 1,
        "in_progress": 0,
        "done": 1,
    }


def test_organization_task_pagination_and_filtering():
    headers = register_and_login("organization-task-filter@example.com")
    organization = create_organization(headers=headers)

    assert create_organization_task(
        headers=headers,
        organization_id=organization["id"],
        title="Alpha task",
        task_status="open",
    ).status_code == status.HTTP_201_CREATED

    assert create_organization_task(
        headers=headers,
        organization_id=organization["id"],
        title="Beta task",
        task_status="done",
    ).status_code == status.HTTP_201_CREATED

    response = client.get(
        f"/organizations/{organization['id']}/tasks/paginated?status=open&search=Alpha&limit=10&offset=0",
        headers=headers,
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["total"] == 1
    assert data["limit"] == 10
    assert data["offset"] == 0
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Alpha task"
    assert data["items"][0]["status"] == "open"


def invite_and_accept_member(
    owner_headers: dict[str, str],
    member_headers: dict[str, str],
    organization_id: int,
    member_email: str,
):
    invitation_response = client.post(
        f"/organizations/{organization_id}/invitations",
        headers=owner_headers,
        json={
            "email": member_email,
            "role": "member",
        },
    )
    assert invitation_response.status_code == status.HTTP_201_CREATED

    invitation_id = invitation_response.json()["id"]

    accept_response = client.post(
        f"/organizations/invitations/{invitation_id}/accept",
        headers=member_headers,
    )
    assert accept_response.status_code == status.HTTP_200_OK

    return accept_response.json()


def test_invited_member_can_manage_organization_tasks():
    owner_headers = register_and_login("organization-task-owner-member@example.com")
    member_email = "organization-task-member@example.com"
    member_headers = register_and_login(member_email)

    organization = create_organization(headers=owner_headers)

    invite_and_accept_member(
        owner_headers=owner_headers,
        member_headers=member_headers,
        organization_id=organization["id"],
        member_email=member_email,
    )

    create_response = create_organization_task(
        headers=member_headers,
        organization_id=organization["id"],
        title="Member-created task",
        task_status="open",
    )

    assert create_response.status_code == status.HTTP_201_CREATED

    task_id = create_response.json()["id"]

    update_response = client.put(
        f"/organizations/{organization['id']}/tasks/{task_id}",
        headers=member_headers,
        json={
            "title": "Member-updated task",
            "status": "done",
        },
    )

    assert update_response.status_code == status.HTTP_200_OK
    assert update_response.json()["title"] == "Member-updated task"
    assert update_response.json()["status"] == "done"

    delete_response = client.delete(
        f"/organizations/{organization['id']}/tasks/{task_id}",
        headers=member_headers,
    )

    assert delete_response.status_code == status.HTTP_204_NO_CONTENT
