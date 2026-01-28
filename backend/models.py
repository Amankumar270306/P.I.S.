from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid
from datetime import datetime

class Task(Base):
    __tablename__ = "tasks"

    # We assume uuid-ossp extension is enabled in DB, but SQLAlchemy can generate UUIDs too
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    status = Column(String, default="todo") # 'todo', 'in_progress', 'done', 'backlog'
    energy_cost = Column(Integer)
    context = Column(String)
    # linked_email_id can be added similarly if needed for the backend logic
    created_at = Column(DateTime, default=datetime.utcnow)
