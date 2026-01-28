from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class TaskBase(BaseModel):
    title: str
    energy_cost: Optional[int] = None
    context: Optional[str] = None
    status: Optional[str] = "todo"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    pass

class Task(TaskBase):
    id: UUID

    class Config:
        from_attributes = True
