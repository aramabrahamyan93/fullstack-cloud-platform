from typing import Literal

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field

TaskStatus = Literal["open", "in_progress", "done"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    status: TaskStatus


class TaskResponse(BaseModel):
    id: int
    title: str
    status: TaskStatus

    model_config = ConfigDict(from_attributes=True)