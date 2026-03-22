from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from enum import Enum
from datetime import datetime
import uuid
from uuid import UUID

class ContextEnum(str, Enum):
    DEEP_WORK = "DEEP_WORK"
    ADMIN = "ADMIN"
    MEETING = "MEETING"
    ERRAND = "ERRAND"

class SourceTypeEnum(str, Enum):
    DOCUMENT = "document"

class TaskBase(BaseModel):
    title: str = Field(..., description="The title of the task.")
    energy_cost: float = Field(..., ge=0.5, le=90, description="Energy points")
    context: Optional[str] = Field(None, description="The context or description of the task.")
    priority: Optional[str] = Field("Medium", description="Priority level")
    deadline: Optional[datetime] = Field(None, description="The deadline for the task.")
    scheduled_date: Optional[datetime] = Field(None, description="The date this task is scheduled for.")
    started_at: Optional[datetime] = Field(None, description="When the task was started.")
    ended_at: Optional[datetime] = Field(None, description="When the task was completed.")
    importance: bool = Field(False, description="Is this task important?")
    is_urgent: bool = Field(False, description="Is this task urgent?")
    status: Optional[str] = Field("todo", description="Current status")
    list_id: Optional[UUID] = Field(None, description="The list this task belongs to.")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    energy_cost: Optional[float] = Field(None, ge=0.5, le=90)
    context: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    importance: Optional[bool] = None
    is_urgent: Optional[bool] = None
    list_id: Optional[UUID] = None

class TaskResponse(TaskBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TaskListBase(BaseModel):
    name: str = Field(..., description="Name of the task list.")
    color: Optional[str] = Field("#6366f1", description="Color hex code for the list.")
    icon: Optional[str] = Field("list", description="Icon name for the list.")
    is_permanent: bool = Field(False, description="Whether this list is permanent and system-prebuilt.")

class TaskListCreate(TaskListBase):
    pass

class TaskListResponse(TaskListBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class LinkedTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    source_type: SourceTypeEnum
    source_doc_id: Optional[UUID] = None
    status: Optional[str] = "pending"

class LinkedTaskCreate(LinkedTaskBase):
    user_id: uuid.UUID

class LinkedTaskResponse(LinkedTaskBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
