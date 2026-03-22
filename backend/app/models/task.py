from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime
from app.db.base import Base

class ContextEnum(str, enum.Enum):
    DEEP_WORK = "DEEP_WORK"
    ADMIN = "ADMIN"
    MEETING = "MEETING"
    ERRAND = "ERRAND"

class SourceTypeEnum(str, enum.Enum):
    DOCUMENT = "document"

class TaskList(Base):
    __tablename__ = "task_lists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    color = Column(String, default="#6366f1")
    icon = Column(String, default="list")
    is_permanent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    list_id = Column(UUID(as_uuid=True), ForeignKey("task_lists.id"), nullable=True)
    title = Column(String, nullable=False)
    energy_cost = Column(Float, nullable=False)
    context = Column(String, nullable=True)
    status = Column(String, default="todo")
    priority = Column(String, default="Medium")
    deadline = Column(DateTime, nullable=True)
    scheduled_date = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    importance = Column(Boolean, default=False)
    is_urgent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class LinkedTask(Base):
    __tablename__ = "linked_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(String)
    source_type = Column(String, nullable=False)
    source_doc_id = Column(UUID(as_uuid=True), ForeignKey("docs.id"), nullable=True) 
    status = Column(String, default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
