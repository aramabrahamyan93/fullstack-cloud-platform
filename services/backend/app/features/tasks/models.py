from sqlalchemy import CheckConstraint
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String

from app.db.database import Base
from app.features.tasks.constants import TASK_STATUS_DONE
from app.features.tasks.constants import TASK_STATUS_IN_PROGRESS
from app.features.tasks.constants import TASK_STATUS_MAX_LENGTH
from app.features.tasks.constants import TASK_STATUS_OPEN
from app.features.tasks.constants import TASK_TITLE_MAX_LENGTH


class Task(Base):
    __tablename__ = "tasks"

    __table_args__ = (
        CheckConstraint(
            f"status IN (\'{TASK_STATUS_OPEN}\', \'{TASK_STATUS_IN_PROGRESS}\', \'{TASK_STATUS_DONE}\')",
            name="ck_tasks_status",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(TASK_TITLE_MAX_LENGTH), nullable=False)
    status = Column(String(TASK_STATUS_MAX_LENGTH), nullable=False)
    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )