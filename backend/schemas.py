from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from enum import Enum
from datetime import datetime
import uuid
from uuid import UUID

class ContextEnum(str, Enum):
    DEEP_WORK = "DEEP_WORK"
    ADMIN = "ADMIN"
    MEETING = "MEETING"
    ERRAND = "ERRAND"

class TaskBase(BaseModel):
    title: str = Field(..., description="The title of the task.")
    energy_cost: float = Field(..., ge=0.5, le=90, description="Energy points (1 point = 10 min). Range: 0.5-90.")
    context: Optional[str] = Field(None, description="The context or description of the task.")
    priority: Optional[str] = Field("Medium", description="Priority level: 'High', 'Medium', 'Low'.")
    deadline: Optional[datetime] = Field(None, description="The deadline for the task.")
    scheduled_date: Optional[datetime] = Field(None, description="The date this task is scheduled for.")
    started_at: Optional[datetime] = Field(None, description="When the task was started.")
    ended_at: Optional[datetime] = Field(None, description="When the task was completed.")
    importance: bool = Field(False, description="Is this task important?")
    is_urgent: bool = Field(False, description="Is this task urgent?")
    status: Optional[str] = Field("todo", description="Current status: 'todo', 'in_progress', 'done'.")
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

# --- Task List Schemas ---

class TaskListBase(BaseModel):
    name: str = Field(..., description="Name of the task list.")
    color: Optional[str] = Field("#6366f1", description="Color hex code for the list.")
    icon: Optional[str] = Field("list", description="Icon name for the list.")

class TaskListCreate(TaskListBase):
    pass

class TaskListResponse(TaskListBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SystemState(BaseModel):
    current_energy: float = Field(..., description="Current available energy points (1 point = 10 min).")
    pending_tasks: int = Field(..., description="Count of tasks in 'todo' status.")
    overdue_tasks: int = Field(..., description="Count of tasks past their deadline.")

# --- User Profile Schemas ---

class UserBase(BaseModel):
    first_name: str = Field(..., description="User's first name")
    last_name: str = Field("", description="User's last name")
    email: str = Field(..., description="User's email address")
    phone: Optional[str] = Field(None, description="User's phone number")
    age: Optional[int] = Field(None, description="User's age")
    profession: Optional[str] = Field(None, description="User's profession")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="User's password")

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    profession: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: str
    password: str

class UserLoginResponse(BaseModel):
    user: UserResponse
    message: str

# --- Document Schemas ---

class DocumentBase(BaseModel):
    title: str
    content: Optional[Any] = None  # JSONB content

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Any] = None

class Document(DocumentBase):
    id: UUID
    created_at: datetime
    last_edited: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Consistency Schemas ---

class ConsistencyLogBase(BaseModel):
    date: datetime
    energy_used: float
    total_capacity: float

class ConsistencyLogCreate(ConsistencyLogBase):
    user_id: uuid.UUID

class ConsistencyLog(ConsistencyLogBase):
    id: int
    user_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)

# --- Linked Task Schemas ---

class SourceTypeEnum(str, Enum):
    DOCUMENT = "document"

class LinkedTaskBase(BaseModel):
    title: str = Field(..., description="Title of the linked task.")
    description: Optional[str] = Field(None, description="Description or summary.")
    source_type: SourceTypeEnum = Field(..., description="Origin of the task.")
    source_doc_id: Optional[UUID] = Field(None, description="Linked Doc ID.")
    status: Optional[str] = Field("pending", description="Status: pending, converted, dismissed.")

class LinkedTaskCreate(LinkedTaskBase):
    user_id: uuid.UUID

class LinkedTaskResponse(LinkedTaskBase):
    id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Integration Schemas ---

class EnergyTransaction(BaseModel):
    amount: float = Field(..., description="Energy points to change (1 point = 10 min).")
    reason: str = Field(..., description="Reason for the energy change.")

class IntegrationResponse(BaseModel):
    action_taken: str
    task_id: Optional[int] = None
    new_balance: Optional[float] = None

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# --- Team Chat Schemas ---

class ChatUserBase(BaseModel):
    first_name: str
    last_name: str = ""

class ChatUserCreate(ChatUserBase):
    pass

class User(ChatUserBase):
    id: uuid.UUID
    avatar_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    channel_id: uuid.UUID
    sender_id: uuid.UUID

class Message(MessageBase):
    id: uuid.UUID
    channel_id: uuid.UUID
    sender_id: uuid.UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ChannelBase(BaseModel):
    name: Optional[str] = None
    is_group: bool = False

class Channel(ChannelBase):
    id: uuid.UUID
    last_message: Optional[Message] = None
    
    model_config = ConfigDict(from_attributes=True)
