from pydantic import BaseModel
from pydantic import ConfigDict


class TaskCreate(BaseModel):
    title: str
    status: str


class TaskResponse(BaseModel):
    id: int
    title: str
    status: str

    model_config = ConfigDict(from_attributes=True)