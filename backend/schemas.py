from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from enum import Enum
from datetime import datetime
from uuid import UUID

class ContextEnum(str, Enum):
    DEEP_WORK = "DEEP_WORK"
    ADMIN = "ADMIN"
    MEETING = "MEETING"
    ERRAND = "ERRAND"

class TaskBase(BaseModel):
    title: str = Field(..., description="The title of the task.")
    energy_cost: int = Field(..., ge=1, le=10, description="The cognitive load required, from 1 (Trivial) to 10 (Brain Drain).")
    context: ContextEnum = Field(..., description="The context or category of the task.")
    priority: Optional[str] = Field("Medium", description="Priority level: 'High', 'Medium', 'Low'.")
    deadline: Optional[datetime] = Field(None, description="The deadline for the task.")
    scheduled_date: Optional[datetime] = Field(None, description="The date this task is scheduled for.")
    status: Optional[str] = Field("todo", description="Current status: 'todo', 'in_progress', 'done'.")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    energy_cost: Optional[int] = Field(None, ge=1, le=10)
    context: Optional[ContextEnum] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SystemState(BaseModel):
    current_energy: int = Field(..., description="Current available energy capacity.")
    pending_tasks: int = Field(..., description="Count of tasks in 'todo' status.")
    overdue_tasks: int = Field(..., description="Count of tasks past their deadline.")

# --- Integration Schemas ---

class EmailPayload(BaseModel):
    subject: str = Field(..., description="Subject line of the email.")
    sender: str = Field(..., description="Email address of the sender.")
    body: Optional[str] = Field(None, description="Body content of the email.")

class NotionPage(BaseModel):
    id: str = Field(..., description="Notion Page ID")
    title: str = Field(..., description="Page Title")
    status: str = Field(..., description="Status property from Notion")

class NotionSyncPayload(BaseModel):
    pages: list[NotionPage]

class EnergyTransaction(BaseModel):
    amount: int = Field(..., description="Energy amount to change (negative for deduction).")
    reason: str = Field(..., description="Reason for the energy change.")

class IntegrationResponse(BaseModel):
    action_taken: str
    task_id: Optional[int] = None
    new_balance: Optional[int] = None

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
