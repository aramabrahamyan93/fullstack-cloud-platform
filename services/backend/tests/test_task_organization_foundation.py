from fastapi.testclient import TestClient

from app.db.database import Base
from app.db.database import engine
from app.db.dependencies import get_db
from app.features.organizations.schemas import OrganizationCreate
from app.features.organizations.service import create_user_organization
from app.features.tasks.repository import TaskRepository
from app.features.tasks.schemas import TaskCreate
from app.features.tasks.schemas import TaskListQuery
from app.features.tasks.service import create_task_service
from app.features.users.models import User
from app.main import app


client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def register_and_get_user(
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


def test_legacy_task_creation_keeps_organization_id_empty() -> None:
    db = next(get_db())
    try:
        user = register_and_get_user(email="legacy-task-owner@example.com")
        service = create_task_service(TaskRepository(db))

        task = service.create_task(
            task=TaskCreate(title="Legacy task", status="open"),
            owner_id=user.id,
        )

        assert task.owner_id == user.id
        assert task.organization_id is None
    finally:
        db.close()


def test_can_create_and_list_organization_tasks() -> None:
    db = next(get_db())
    try:
        user = register_and_get_user(email="organization-task-owner@example.com")
        organization = create_user_organization(
            db,
            current_user=user,
            organization_create=OrganizationCreate(name="Task Workspace"),
        )
        service = create_task_service(TaskRepository(db))

        created_task = service.create_organization_task(
            task=TaskCreate(title="Organization task", status="in_progress"),
            owner_id=user.id,
            organization_id=organization.id,
        )

        assert created_task.owner_id == user.id
        assert created_task.organization_id == organization.id

        tasks = service.get_organization_tasks(
            organization_id=organization.id,
            query=TaskListQuery(),
        )

        assert len(tasks) == 1
        assert tasks[0].id == created_task.id
        assert tasks[0].title == "Organization task"
        assert tasks[0].status == "in_progress"
    finally:
        db.close()


def test_organization_task_stats_are_scoped_by_organization() -> None:
    db = next(get_db())
    try:
        user = register_and_get_user(email="organization-task-stats-owner@example.com")
        first_organization = create_user_organization(
            db,
            current_user=user,
            organization_create=OrganizationCreate(name="First Workspace"),
        )
        second_organization = create_user_organization(
            db,
            current_user=user,
            organization_create=OrganizationCreate(name="Second Workspace"),
        )
        service = create_task_service(TaskRepository(db))

        service.create_organization_task(
            task=TaskCreate(title="First open task", status="open"),
            owner_id=user.id,
            organization_id=first_organization.id,
        )
        service.create_organization_task(
            task=TaskCreate(title="First done task", status="done"),
            owner_id=user.id,
            organization_id=first_organization.id,
        )
        service.create_organization_task(
            task=TaskCreate(title="Second open task", status="open"),
            owner_id=user.id,
            organization_id=second_organization.id,
        )

        first_stats = service.get_organization_task_stats(
            organization_id=first_organization.id,
        )

        assert first_stats.all == 2
        assert first_stats.open == 1
        assert first_stats.in_progress == 0
        assert first_stats.done == 1
    finally:
        db.close()
