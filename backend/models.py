from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum
from database import Base
from datetime import datetime
import enum

# Define Enum for SQLAlchemy
class ContextEnum(str, enum.Enum):
    DEEP_WORK = "DEEP_WORK"
    ADMIN = "ADMIN"
    MEETING = "MEETING"
    ERRAND = "ERRAND"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    energy_cost = Column(Integer, nullable=False)
    context = Column(String, nullable=False) # Storing as string for simplicity in SQLite, can use SAEnum in Postgres
    status = Column(String, default="todo")
    priority = Column(String, default="Medium") # High, Medium, Low
    deadline = Column(DateTime, nullable=True)
    scheduled_date = Column(DateTime, nullable=True) # For Auto-Scheduler
    created_at = Column(DateTime, default=datetime.utcnow)

class Email(Base):
    __tablename__ = "emails"
    
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    sender = Column(String)
    is_processed = Column(Integer, default=0) # 0=False, 1=True boolean in sqlite
    received_at = Column(DateTime, default=datetime.utcnow)

class EnergyLog(Base):
    __tablename__ = "energy_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    capacity = Column(Integer, default=40)
    used = Column(Integer, default=0)
    reason = Column(String)
