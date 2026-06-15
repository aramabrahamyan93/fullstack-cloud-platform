from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Query
from fastapi import status
from sqlalchemy.orm import Session

from app.db.dependencies import get_current_user
from app.db.dependencies import get_db
from app.features.organizations.service import ensure_user_can_manage_organization_tasks
from app.features.tasks.constants import DEFAULT_TASK_LIMIT
from app.features.tasks.constants import DEFAULT_TASK_OFFSET
from app.features.tasks.constants import MAX_TASK_LIMIT
from app.features.tasks.constants import MIN_TASK_LIMIT
from app.features.tasks.constants import MIN_TASK_OFFSET
from app.features.tasks.constants import TASK_SEARCH_MAX_LENGTH
from app.features.tasks.constants import TASK_SEARCH_MIN_LENGTH
from app.features.tasks.repository import TaskRepository
from app.features.tasks.schemas import PaginatedTaskResponse
from app.features.tasks.schemas import TaskCreate
from app.features.tasks.schemas import TaskListQuery
from app.features.tasks.schemas import TaskResponse
from app.features.tasks.schemas import TaskStatsResponse
from app.features.tasks.schemas import TaskStatus
from app.features.tasks.schemas import TaskUpdate
from app.features.tasks.service import TaskService
from app.features.tasks.service import create_task_service
from app.features.users.models import User

router = APIRouter(
    prefix="/organizations/{organization_id}/tasks",
    tags=["organization-tasks"],
)


def get_task_service(
    db: Session = Depends(get_db),
) -> TaskService:
    repository = TaskRepository(db)
    return create_task_service(repository)


@router.get(
    "",
    response_model=list[TaskResponse],
)
def list_organization_tasks(
    organization_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
    db: Session = Depends(get_db),
    task_status: TaskStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(
        default=None,
        min_length=TASK_SEARCH_MIN_LENGTH,
        max_length=TASK_SEARCH_MAX_LENGTH,
    ),
    limit: int = Query(
        default=DEFAULT_TASK_LIMIT,
        ge=MIN_TASK_LIMIT,
        le=MAX_TASK_LIMIT,
    ),
    offset: int = Query(
        default=DEFAULT_TASK_OFFSET,
        ge=MIN_TASK_OFFSET,
    ),
):
    ensure_user_can_manage_organization_tasks(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    query = TaskListQuery(
        status=task_status,
        search=search,
        limit=limit,
        offset=offset,
    )

    return service.get_organization_tasks(
        organization_id=organization_id,
        query=query,
    )


@router.get(
    "/paginated",
    response_model=PaginatedTaskResponse,
)
def list_paginated_organization_tasks(
    organization_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
    db: Session = Depends(get_db),
    task_status: TaskStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(
        default=None,
        min_length=TASK_SEARCH_MIN_LENGTH,
        max_length=TASK_SEARCH_MAX_LENGTH,
    ),
    limit: int = Query(
        default=DEFAULT_TASK_LIMIT,
        ge=MIN_TASK_LIMIT,
        le=MAX_TASK_LIMIT,
    ),
    offset: int = Query(
        default=DEFAULT_TASK_OFFSET,
        ge=MIN_TASK_OFFSET,
    ),
):
    ensure_user_can_manage_organization_tasks(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    query = TaskListQuery(
        status=task_status,
        search=search,
        limit=limit,
        offset=offset,
    )

    return service.get_paginated_organization_tasks(
        organization_id=organization_id,
        query=query,
    )


@router.get(
    "/stats",
    response_model=TaskStatsResponse,
)
def get_organization_task_stats(
    organization_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
    db: Session = Depends(get_db),
):
    ensure_user_can_manage_organization_tasks(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    return service.get_organization_task_stats(
        organization_id=organization_id,
    )


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_organization_task(
    organization_id: int,
    task: TaskCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
    db: Session = Depends(get_db),
):
    ensure_user_can_manage_organization_tasks(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    return service.create_organization_task(
        task=task,
        owner_id=current_user.id,
        organization_id=organization_id,
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_existing_organization_task(
    organization_id: int,
    task_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
    db: Session = Depends(get_db),
):
    ensure_user_can_manage_organization_tasks(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    return service.get_organization_task(
        task_id=task_id,
        organization_id=organization_id,
    )


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
)
def update_existing_organization_task(
    organization_id: int,
    task_id: int,
    task: TaskUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
    db: Session = Depends(get_db),
):
    ensure_user_can_manage_organization_tasks(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    return service.update_organization_task(
        task_id=task_id,
        task=task,
        organization_id=organization_id,
    )


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_organization_task(
    organization_id: int,
    task_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
    db: Session = Depends(get_db),
):
    ensure_user_can_manage_organization_tasks(
        db,
        organization_id=organization_id,
        current_user=current_user,
    )

    service.delete_organization_task(
        task_id=task_id,
        organization_id=organization_id,
    )
