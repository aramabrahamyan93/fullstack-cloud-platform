from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate
from app.schemas.task import TaskResponse
from app.schemas.task import TaskUpdate
from app.services.task_service import TaskNotFoundError
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


def raise_task_not_found(error: TaskNotFoundError) -> None:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=str(error),
    )


@router.get(
    "",
    response_model=list[TaskResponse],
)
def list_tasks(
    service: TaskService = Depends(get_task_service),
):
    return service.get_tasks()


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_task(
    task: TaskCreate,
    service: TaskService = Depends(get_task_service),
):
    return service.create_task(task)


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_existing_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
):
    try:
        return service.get_task(task_id)
    except TaskNotFoundError as error:
        raise_task_not_found(error)


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
)
def update_existing_task(
    task_id: int,
    task: TaskUpdate,
    service: TaskService = Depends(get_task_service),
):
    try:
        return service.update_task(task_id, task)
    except TaskNotFoundError as error:
        raise_task_not_found(error)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
):
    try:
        service.delete_task(task_id)
    except TaskNotFoundError as error:
        raise_task_not_found(error)