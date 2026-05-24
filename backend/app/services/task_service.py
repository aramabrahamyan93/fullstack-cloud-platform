import logging

from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import TaskCreate

logger = logging.getLogger(__name__)


def get_tasks(db: Session):
    logger.info("Fetching tasks from database")
    tasks = db.query(Task).all()
    logger.info("Fetched %s tasks", len(tasks))
    return tasks


def create_task(db: Session, task: TaskCreate):
    logger.info("Creating task with title=%s status=%s", task.title, task.status)

    db_task = Task(
        title=task.title,
        status=task.status,
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    logger.info("Task created with id=%s", db_task.id)

    return db_task