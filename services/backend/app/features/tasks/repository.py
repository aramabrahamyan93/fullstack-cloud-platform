from sqlalchemy.orm import Query
from sqlalchemy.orm import Session

from app.features.tasks.models import Task
from app.features.tasks.schemas import TaskListQuery


class TaskRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_tasks(
        self,
        owner_id: int,
        query: TaskListQuery,
    ) -> list[Task]:
        db_query = self._build_owned_tasks_query(
            owner_id=owner_id,
            query=query,
        )

        return (
            db_query.order_by(Task.id.asc())
            .offset(query.offset)
            .limit(query.limit)
            .all()
        )

    def count_tasks(
        self,
        owner_id: int,
        query: TaskListQuery,
    ) -> int:
        db_query = self._build_owned_tasks_query(
            owner_id=owner_id,
            query=query,
        )

        return db_query.count()

    def count_tasks_by_status(self, owner_id: int) -> dict[str, int]:
        return {
            "all": self.count_tasks(
                owner_id=owner_id,
                query=TaskListQuery(),
            ),
            "open": self.count_tasks(
                owner_id=owner_id,
                query=TaskListQuery(status="open"),
            ),
            "in_progress": self.count_tasks(
                owner_id=owner_id,
                query=TaskListQuery(status="in_progress"),
            ),
            "done": self.count_tasks(
                owner_id=owner_id,
                query=TaskListQuery(status="done"),
            ),
        }

    def get_by_id(self, task_id: int, owner_id: int) -> Task | None:
        return (
            self.db.query(Task)
            .filter(Task.id == task_id, Task.owner_id == owner_id)
            .first()
        )

    def list_organization_tasks(
        self,
        organization_id: int,
        query: TaskListQuery,
    ) -> list[Task]:
        db_query = self._build_organization_tasks_query(
            organization_id=organization_id,
            query=query,
        )

        return (
            db_query.order_by(Task.id.asc())
            .offset(query.offset)
            .limit(query.limit)
            .all()
        )

    def count_organization_tasks(
        self,
        organization_id: int,
        query: TaskListQuery,
    ) -> int:
        db_query = self._build_organization_tasks_query(
            organization_id=organization_id,
            query=query,
        )

        return db_query.count()

    def count_organization_tasks_by_status(
        self,
        organization_id: int,
    ) -> dict[str, int]:
        return {
            "all": self.count_organization_tasks(
                organization_id=organization_id,
                query=TaskListQuery(),
            ),
            "open": self.count_organization_tasks(
                organization_id=organization_id,
                query=TaskListQuery(status="open"),
            ),
            "in_progress": self.count_organization_tasks(
                organization_id=organization_id,
                query=TaskListQuery(status="in_progress"),
            ),
            "done": self.count_organization_tasks(
                organization_id=organization_id,
                query=TaskListQuery(status="done"),
            ),
        }

    def get_by_id_in_organization(
        self,
        task_id: int,
        organization_id: int,
    ) -> Task | None:
        return (
            self.db.query(Task)
            .filter(
                Task.id == task_id,
                Task.organization_id == organization_id,
            )
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
        query: TaskListQuery,
    ) -> Query:
        db_query = self.db.query(Task).filter(Task.owner_id == owner_id)

        if query.status is not None:
            db_query = db_query.filter(Task.status == query.status)

        normalized_search = query.search.strip() if query.search is not None else None

        if normalized_search:
            db_query = db_query.filter(Task.title.ilike(f"%{normalized_search}%"))

        return db_query

    def _build_organization_tasks_query(
        self,
        organization_id: int,
        query: TaskListQuery,
    ) -> Query:
        db_query = self.db.query(Task).filter(Task.organization_id == organization_id)

        if query.status is not None:
            db_query = db_query.filter(Task.status == query.status)

        normalized_search = query.search.strip() if query.search is not None else None

        if normalized_search:
            db_query = db_query.filter(Task.title.ilike(f"%{normalized_search}%"))

        return db_query
