from typing import Literal

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field

TaskStatus = Literal["open", "in_progress", "done"]


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
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
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


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