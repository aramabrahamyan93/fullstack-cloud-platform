import logging

from app.core.errors import NotFoundError
from app.models.task import Task
from app.repositories.task_repository import TaskRepository
from app.schemas.task import PaginatedTaskResponse
from app.schemas.task import TaskStatsResponse
from app.schemas.task import TaskCreate
from app.schemas.task import TaskStatus
from app.schemas.task import TaskUpdate

logger = logging.getLogger(__name__)


class TaskNotFoundError(NotFoundError):
    def __init__(self, task_id: int):
        self.task_id = task_id

        super().__init__(
            message=f"Task with id={task_id} was not found.",
            error_code="task_not_found",
        )


class TaskService:
    def __init__(self, repository: TaskRepository):
        self.repository = repository

    def get_tasks(
        self,
        owner_id: int,
        status_filter: TaskStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Task]:
        logger.info(
            (
                "Fetching tasks from database for owner_id=%s "
                "status_filter=%s limit=%s offset=%s"
            ),
            owner_id,
            status_filter,
            limit,
            offset,
        )

        tasks = self.repository.list_tasks(
            owner_id=owner_id,
            status_filter=status_filter,
            limit=limit,
            offset=offset,
        )

        logger.info(
            (
                "Fetched %s tasks for owner_id=%s "
                "status_filter=%s limit=%s offset=%s"
            ),
            len(tasks),
            owner_id,
            status_filter,
            limit,
            offset,
        )

        return tasks

    def get_paginated_tasks(
        self,
        owner_id: int,
        status_filter: TaskStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> PaginatedTaskResponse:
        logger.info(
            (
                "Fetching paginated tasks from database for owner_id=%s "
                "status_filter=%s limit=%s offset=%s"
            ),
            owner_id,
            status_filter,
            limit,
            offset,
        )

        tasks = self.repository.list_tasks(
            owner_id=owner_id,
            status_filter=status_filter,
            limit=limit,
            offset=offset,
        )
        total = self.repository.count_tasks(
            owner_id=owner_id,
            status_filter=status_filter,
        )

        logger.info(
            (
                "Fetched %s/%s paginated tasks for owner_id=%s "
                "status_filter=%s limit=%s offset=%s"
            ),
            len(tasks),
            total,
            owner_id,
            status_filter,
            limit,
            offset,
        )

        return PaginatedTaskResponse(
            items=tasks,
            total=total,
            limit=limit,
            offset=offset,
        )

    def get_task_stats(self, owner_id: int) -> TaskStatsResponse:
        logger.info("Fetching task stats for owner_id=%s", owner_id)

        stats = self.repository.count_tasks_by_status(owner_id=owner_id)

        logger.info(
            (
                "Fetched task stats for owner_id=%s "
                "all=%s open=%s in_progress=%s done=%s"
            ),
            owner_id,
            stats["all"],
            stats["open"],
            stats["in_progress"],
            stats["done"],
        )

        return TaskStatsResponse(**stats)

    def get_task(self, task_id: int, owner_id: int) -> Task:
        logger.info("Fetching task with id=%s owner_id=%s", task_id, owner_id)
        task = self.repository.get_by_id(task_id=task_id, owner_id=owner_id)

        if task is None:
            logger.info(
                "Task not found with id=%s owner_id=%s",
                task_id,
                owner_id,
            )
            raise TaskNotFoundError(task_id)

        return task

    def create_task(self, task: TaskCreate, owner_id: int) -> Task:
        logger.info(
            "Creating task with title=%s status=%s owner_id=%s",
            task.title,
            task.status,
            owner_id,
        )

        db_task = Task(
            title=task.title,
            status=task.status,
            owner_id=owner_id,
        )

        self.repository.add(db_task)
        self.repository.commit()
        self.repository.refresh(db_task)

        logger.info("Task created with id=%s owner_id=%s", db_task.id, owner_id)

        return db_task

    def update_task(self, task_id: int, task: TaskUpdate, owner_id: int) -> Task:
        logger.info("Updating task with id=%s owner_id=%s", task_id, owner_id)

        db_task = self.get_task(task_id=task_id, owner_id=owner_id)
        db_task.title = task.title
        db_task.status = task.status

        self.repository.commit()
        self.repository.refresh(db_task)

        logger.info("Task updated with id=%s owner_id=%s", db_task.id, owner_id)

        return db_task

    def delete_task(self, task_id: int, owner_id: int) -> None:
        logger.info("Deleting task with id=%s owner_id=%s", task_id, owner_id)

        db_task = self.get_task(task_id=task_id, owner_id=owner_id)
        self.repository.delete(db_task)
        self.repository.commit()

        logger.info("Task deleted with id=%s owner_id=%s", task_id, owner_id)


def create_task_service(repository: TaskRepository) -> TaskService:
    return TaskService(repository)