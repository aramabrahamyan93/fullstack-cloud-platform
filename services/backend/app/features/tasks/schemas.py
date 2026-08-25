from typing import Literal

from app.features.tasks.constants import DEFAULT_TASK_LIMIT
from app.features.tasks.constants import DEFAULT_TASK_OFFSET
from app.features.tasks.constants import MAX_TASK_LIMIT
from app.features.tasks.constants import MIN_TASK_LIMIT
from app.features.tasks.constants import MIN_TASK_OFFSET
from app.features.tasks.constants import TASK_STATUS_DONE
from app.features.tasks.constants import TASK_STATUS_IN_PROGRESS
from app.features.tasks.constants import TASK_STATUS_OPEN
from app.features.tasks.constants import TASK_TITLE_MAX_LENGTH

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field

TaskStatus = Literal[
    TASK_STATUS_OPEN,
    TASK_STATUS_IN_PROGRESS,
    TASK_STATUS_DONE,
]


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=TASK_TITLE_MAX_LENGTH)
    status: TaskStatus


class TaskCreate(TaskBase):
    pass


class TaskUpdate(TaskBase):
    pass


class TaskResponse(TaskBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class TaskListQuery(BaseModel):
    status: TaskStatus | None = None
    search: str | None = None
    limit: int = Field(
        default=DEFAULT_TASK_LIMIT,
        ge=MIN_TASK_LIMIT,
        le=MAX_TASK_LIMIT,
    )
    offset: int = Field(
        default=DEFAULT_TASK_OFFSET,
        ge=MIN_TASK_OFFSET,
    )


class PaginatedTaskResponse(BaseModel):
    items: list[TaskResponse]
    total: int = Field(ge=0)
    limit: int = Field(ge=1)
    offset: int = Field(ge=0)


class TaskStatsResponse(BaseModel):
    all: int = Field(ge=0)
    open: int = Field(ge=0)
    in_progress: int = Field(ge=0)
    done: int = Field(ge=0)