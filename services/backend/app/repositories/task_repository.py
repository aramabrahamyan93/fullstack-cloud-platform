from sqlalchemy.orm import Query
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
        search: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Task]:
        query = self._build_owned_tasks_query(
            owner_id=owner_id,
            status_filter=status_filter,
            search=search,
        )

        return (
            query.order_by(Task.id.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count_tasks(
        self,
        owner_id: int,
        status_filter: TaskStatus | None = None,
        search: str | None = None,
    ) -> int:
        query = self._build_owned_tasks_query(
            owner_id=owner_id,
            status_filter=status_filter,
            search=search,
        )

        return query.count()

    def count_tasks_by_status(self, owner_id: int) -> dict[str, int]:
        return {
            "all": self.count_tasks(owner_id=owner_id),
            "open": self.count_tasks(owner_id=owner_id, status_filter="open"),
            "in_progress": self.count_tasks(
                owner_id=owner_id,
                status_filter="in_progress",
            ),
            "done": self.count_tasks(owner_id=owner_id, status_filter="done"),
        }

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

    def _build_owned_tasks_query(
        self,
        owner_id: int,
        status_filter: TaskStatus | None = None,
        search: str | None = None,
    ) -> Query:
        query = self.db.query(Task).filter(Task.owner_id == owner_id)

        if status_filter is not None:
            query = query.filter(Task.status == status_filter)

        normalized_search = search.strip() if search is not None else None

        if normalized_search:
            query = query.filter(Task.title.ilike(f"%{normalized_search}%"))

        return query