from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base import Base

class EnergyLog(Base):
    __tablename__ = "energy_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(Date, default=datetime.utcnow)
    total_capacity = Column(Float, default=90.0)
    used_capacity = Column(Float, default=0.0)
    mood_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="energy_logs")

class ConsistencyLog(Base):
    __tablename__ = "consistency_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    date = Column(Date, unique=True, nullable=False, default=datetime.utcnow().date)
    energy_used = Column(Float, default=0.0)
    total_capacity = Column(Float, default=90.0)
