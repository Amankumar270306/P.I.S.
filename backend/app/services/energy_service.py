from uuid import UUID
from datetime import datetime
from app.repositories.energy_repo import EnergyRepository
from app.repositories.task_repo import TaskRepository
from app.schemas.energy import EnergyTransaction

class EnergyService:
    def __init__(self, energy_repo: EnergyRepository, task_repo: TaskRepository):
        self.energy_repo = energy_repo
        self.task_repo = task_repo

    def get_today_energy(self, user_id: UUID):
        today = datetime.now().date()
        log = self.energy_repo.get_energy_log_by_date(user_id, today)
        if not log:
            log = self.energy_repo.create_energy_log(user_id, today)
            
        return {
            "date": str(today),
            "capacity": log.total_capacity,
            "used": log.used_capacity,
            "remaining": log.total_capacity - log.used_capacity
        }

    def reset_today_energy(self, user_id: UUID):
        today = datetime.now().date()
        log = self.energy_repo.get_energy_log_by_date(user_id, today)
        if log:
            log.used_capacity = 0.0
            log.total_capacity = 90.0
            self.energy_repo.update_energy_log(log)
        return {"message": "Energy reset", "remaining": 90.0}

    def log_energy(self, user_id: UUID, transaction: EnergyTransaction):
        # Implementation of pure logging / integration adjustment 
        # (Based on original logic mocked balance)
        current_balance = 35 
        new_balance = current_balance + transaction.amount
        
        # The original code just tracked logs, we keep it simple as requested
        return {"action_taken": "energy_updated", "new_balance": new_balance}

    def get_system_state(self, user_id: UUID):
        # Based on task.status and dates
        today = datetime.utcnow()
        pending = self.task_repo.count_pending_tasks(user_id)
        overdue = self.task_repo.count_overdue_tasks(user_id, today)
        
        return {
            "current_energy": 35, # Mock from original
            "pending_tasks": pending,
            "overdue_tasks": overdue
        }
