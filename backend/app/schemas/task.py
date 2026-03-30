from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class TaskScheduleBase(BaseModel):
    scheduled_date: Optional[datetime] = None
    deadline: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TaskExecutionBase(BaseModel):
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    energy_cost: Optional[int] = Field(None, ge=1, le=10, description="Energy cost scale 1-10")

    model_config = ConfigDict(from_attributes=True)

class TaskBase(BaseModel):
    title: str = Field(..., description="The title of the task.")
    description: Optional[str] = Field(None, description="The detailed description logic.")
    list_id: Optional[UUID] = Field(None, description="The list this task belongs to.")
    status_id: Optional[int] = Field(1, description="Status ID representing To-Do (1), In Progress (2), Done (3), Backlog (4)")
    priority_id: Optional[int] = Field(2, description="Priority ID representing Low (1), Medium (2), High (3)")
    importance: bool = Field(False, description="Is this task important?")
    is_urgent: bool = Field(False, description="Is this task urgent?")

class TaskCreate(TaskBase):
    schedule: Optional[TaskScheduleBase] = None
    execution: Optional[TaskExecutionBase] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    list_id: Optional[UUID] = None
    status_id: Optional[int] = None
    priority_id: Optional[int] = None
    importance: Optional[bool] = None
    is_urgent: Optional[bool] = None
    schedule: Optional[TaskScheduleBase] = None
    execution: Optional[TaskExecutionBase] = None

class TaskResponse(TaskBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    schedule: Optional[TaskScheduleBase] = None
    execution: Optional[TaskExecutionBase] = None

    model_config = ConfigDict(from_attributes=True)

class TaskListBase(BaseModel):
    name: str = Field(..., description="Name of the task list.")
    color: Optional[str] = Field("#6366f1", description="Color hex code for the list.")
    icon: Optional[str] = Field("list", description="Icon name for the list.")
    is_permanent: Optional[bool] = Field(False, description="Is this a system permanent list?")

class TaskListCreate(TaskListBase):
    pass

class TaskListResponse(TaskListBase):
    id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
