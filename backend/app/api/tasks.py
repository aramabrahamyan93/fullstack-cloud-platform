from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.schemas.task import TaskCreate
from app.schemas.task import TaskResponse
from app.services.task_service import create_task
from app.services.task_service import get_tasks

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
)


@router.get(
    "",
    response_model=list[TaskResponse],
)
def list_tasks(
    db: Session = Depends(get_db),
):
    return get_tasks(db)


@router.post(
    "",
    response_model=TaskResponse,
)
def create_new_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
):
    return create_task(db, task)