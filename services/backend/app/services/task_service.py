import logging

from app.models.task import Task
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate
from app.schemas.task import TaskUpdate

logger = logging.getLogger(__name__)


class TaskNotFoundError(Exception):
    def __init__(self, task_id: int):
        self.task_id = task_id
        super().__init__(f"Task with id={task_id} was not found.")


class TaskService:
    def __init__(self, repository: TaskRepository):
        self.repository = repository

    def get_tasks(self) -> list[Task]:
        logger.info("Fetching tasks from database")
        tasks = self.repository.list_tasks()
        logger.info("Fetched %s tasks", len(tasks))
        return tasks

    def get_task(self, task_id: int) -> Task:
        logger.info("Fetching task with id=%s", task_id)
        task = self.repository.get_by_id(task_id)

        if task is None:
            logger.info("Task not found with id=%s", task_id)
            raise TaskNotFoundError(task_id)

        return task

    def create_task(self, task: TaskCreate) -> Task:
        logger.info("Creating task with title=%s status=%s", task.title, task.status)

        db_task = Task(
            title=task.title,
            status=task.status,
        )

        self.repository.add(db_task)
        self.repository.commit()
        self.repository.refresh(db_task)

        logger.info("Task created with id=%s", db_task.id)

        return db_task

    def update_task(self, task_id: int, task: TaskUpdate) -> Task:
        logger.info("Updating task with id=%s", task_id)

        db_task = self.get_task(task_id)
        db_task.title = task.title
        db_task.status = task.status

        self.repository.commit()
        self.repository.refresh(db_task)

        logger.info("Task updated with id=%s", db_task.id)

        return db_task

    def delete_task(self, task_id: int) -> None:
        logger.info("Deleting task with id=%s", task_id)

        db_task = self.get_task(task_id)
        self.repository.delete(db_task)
        self.repository.commit()

        logger.info("Task deleted with id=%s", task_id)


def create_task_service(repository: TaskRepository) -> TaskService:
    return TaskService(repository)