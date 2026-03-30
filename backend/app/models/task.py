from sqlalchemy import Column, String, DateTime, Boolean, Integer, SmallInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base import Base

class TaskList(Base):
    __tablename__ = "task_lists"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    color = Column(String, default="#6366f1")
    icon = Column(String, default="list")
    is_permanent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    user = relationship("User", back_populates="task_lists")
    tasks = relationship("Task", back_populates="task_list")

class TaskStatus(Base):
    __tablename__ = "task_statuses"
    id = Column(SmallInteger, primary_key=True)
    name = Column(String, unique=True, nullable=False)

class TaskPriority(Base):
    __tablename__ = "task_priorities"
    id = Column(SmallInteger, primary_key=True)
    name = Column(String, unique=True, nullable=False)

class Context(Base):
    __tablename__ = "contexts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)

class TaskContext(Base):
    __tablename__ = "task_contexts"
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    context_id = Column(UUID(as_uuid=True), ForeignKey("contexts.id", ondelete="CASCADE"), primary_key=True)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    list_id = Column(UUID(as_uuid=True), ForeignKey("task_lists.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    status_id = Column(SmallInteger, ForeignKey("task_statuses.id"), nullable=True)
    priority_id = Column(SmallInteger, ForeignKey("task_priorities.id"), nullable=True)
    
    importance = Column(Boolean, default=False)
    is_urgent = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="tasks")
    task_list = relationship("TaskList", back_populates="tasks")
    
    # Nested Relationships
    schedule = relationship("TaskSchedule", back_populates="task", uselist=False, cascade="all, delete-orphan")
    execution = relationship("TaskExecution", back_populates="task", uselist=False, cascade="all, delete-orphan")
    contexts = relationship("Context", secondary="task_contexts")

class TaskSchedule(Base):
    __tablename__ = "task_schedule"
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    
    task = relationship("Task", back_populates="schedule")

class TaskExecution(Base):
    __tablename__ = "task_execution"
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    energy_cost = Column(Integer, nullable=True)
    
    task = relationship("Task", back_populates="execution")
