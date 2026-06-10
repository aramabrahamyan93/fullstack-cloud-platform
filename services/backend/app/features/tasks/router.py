from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Query
from fastapi import status
from sqlalchemy.orm import Session

from app.db.dependencies import get_current_user
from app.db.dependencies import get_db
from app.features.users.models import User
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

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
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
def list_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
    status: TaskStatus | None = None,
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
    query = TaskListQuery(
        status=status,
        search=search,
        limit=limit,
        offset=offset,
    )

    return service.get_tasks(
        owner_id=current_user.id,
        query=query,
    )


@router.get(
    "/paginated",
    response_model=PaginatedTaskResponse,
)
def list_paginated_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
    status: TaskStatus | None = None,
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
    query = TaskListQuery(
        status=status,
        search=search,
        limit=limit,
        offset=offset,
    )

    return service.get_paginated_tasks(
        owner_id=current_user.id,
        query=query,
    )


@router.get(
    "/stats",
    response_model=TaskStatsResponse,
)
def get_task_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
):
    return service.get_task_stats(owner_id=current_user.id)


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_task(
    task: TaskCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
):
    return service.create_task(task=task, owner_id=current_user.id)


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_existing_task(
    task_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
):
    return service.get_task(task_id=task_id, owner_id=current_user.id)


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
)
def update_existing_task(
    task_id: int,
    task: TaskUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
):
    return service.update_task(
        task_id=task_id,
        task=task,
        owner_id=current_user.id,
    )


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_task(
    task_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TaskService, Depends(get_task_service)],
):
    service.delete_task(task_id=task_id, owner_id=current_user.id)