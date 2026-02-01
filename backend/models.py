from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime
from database import Base

# Define Enum for SQLAlchemy
class ContextEnum(str, enum.Enum):
    DEEP_WORK = "DEEP_WORK"
    ADMIN = "ADMIN"
    MEETING = "MEETING"
    ERRAND = "ERRAND"

class SourceTypeEnum(str, enum.Enum):
    EMAIL = "email"
    DOCUMENT = "document"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    energy_cost = Column(Integer, nullable=False)
    context = Column(String, nullable=False)
    status = Column(String, default="todo")
    priority = Column(String, default="Medium")
    deadline = Column(DateTime, nullable=True)
    scheduled_date = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    importance = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Email(Base):
    __tablename__ = "emails"
    
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    sender = Column(String)
    # is_processed removed
    received_at = Column(DateTime, default=datetime.utcnow)

class EnergyLog(Base):
    __tablename__ = "energy_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    capacity = Column(Integer, default=30)
    used = Column(Integer, default=0)
    reason = Column(String)

class Document(Base):
    __tablename__ = "docs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    content = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_edited = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Chat Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Channel(Base):
    __tablename__ = "channels"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=True) # Null for DM, Set for Group
    is_group = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="channel", cascade="all, delete-orphan")

class ChannelMember(Base):
    __tablename__ = "channel_members"
    
    channel_id = Column(UUID(as_uuid=True), ForeignKey("channels.id"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("channels.id"))
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("Channel", back_populates="messages")

class ConsistencyLog(Base):
    __tablename__ = "consistency_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    date = Column(Date, unique=True, nullable=False, default=datetime.utcnow().date)
    energy_used = Column(Integer, default=0)
    total_capacity = Column(Integer, default=30)

class LinkedTask(Base):
    __tablename__ = "linked_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(String)
    source_type = Column(String, nullable=False) # 'email' or 'document'
    source_email_id = Column(UUID(as_uuid=True), ForeignKey("emails.id"), nullable=True) 
    source_doc_id = Column(UUID(as_uuid=True), ForeignKey("docs.id"), nullable=True) 
    
    status = Column(String, default='pending')
    importance = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
