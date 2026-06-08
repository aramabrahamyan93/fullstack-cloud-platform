from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends
from fastapi import status
from sqlalchemy.orm import Session

from app.db.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate
from app.schemas.task import TaskResponse
from app.schemas.task import TaskUpdate
from app.services.task_service import TaskService
from app.services.task_service import create_task_service

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
):
    return service.get_tasks(owner_id=current_user.id)


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