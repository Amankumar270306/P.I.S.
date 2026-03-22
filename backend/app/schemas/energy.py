from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
import uuid

class EnergyTransaction(BaseModel):
    amount: float = Field(..., description="Energy points to change (1 point = 10 min).")
    reason: str = Field(..., description="Reason for the energy change.")

class IntegrationResponse(BaseModel):
    action_taken: str
    task_id: Optional[int] = None
    new_balance: Optional[float] = None

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

class SystemState(BaseModel):
    current_energy: float = Field(..., description="Current available energy points (1 point = 10 min).")
    pending_tasks: int = Field(..., description="Count of tasks in 'todo' status.")
    overdue_tasks: int = Field(..., description="Count of tasks past their deadline.")
