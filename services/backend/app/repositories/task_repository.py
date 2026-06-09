from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import TaskStatus


class TaskRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_tasks(
        self,
        owner_id: int,
        status_filter: TaskStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Task]:
        query = self.db.query(Task).filter(Task.owner_id == owner_id)

        if status_filter is not None:
            query = query.filter(Task.status == status_filter)

        return (
            query.order_by(Task.id.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def get_by_id(self, task_id: int, owner_id: int) -> Task | None:
        return (
            self.db.query(Task)
            .filter(Task.id == task_id, Task.owner_id == owner_id)
            .first()
        )

    def add(self, task: Task) -> Task:
        self.db.add(task)
        return task

    def delete(self, task: Task) -> None:
        self.db.delete(task)

    def commit(self) -> None:
        self.db.commit()

    def refresh(self, task: Task) -> None:
        self.db.refresh(task)