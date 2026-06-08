from sqlalchemy.orm import Session

from app.models.task import Task


class TaskRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_tasks(self, owner_id: int) -> list[Task]:
        return (
            self.db.query(Task)
            .filter(Task.owner_id == owner_id)
            .order_by(Task.id.asc())
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