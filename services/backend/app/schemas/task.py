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