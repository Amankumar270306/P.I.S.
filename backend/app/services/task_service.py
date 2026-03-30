from fastapi import HTTPException
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from app.repositories.task_repo import TaskRepository
from app.repositories.energy_repo import EnergyRepository
from app.schemas.task import TaskCreate, TaskUpdate, TaskListCreate

class TaskService:
    def __init__(self, task_repo: TaskRepository, energy_repo: EnergyRepository):
        self.task_repo = task_repo
        self.energy_repo = energy_repo

    # --- Task Lists ---
    def get_lists(self, user_id: UUID):
        return self.task_repo.get_lists_by_user(user_id)

    def create_list(self, user_id: UUID, list_in: TaskListCreate):
        list_data = list_in.model_dump()
        list_data["is_permanent"] = False
        list_data["user_id"] = user_id
        return self.task_repo.create_list(list_data)

    def delete_list(self, list_id: UUID):
        db_list = self.task_repo.get_list_by_id(list_id)
        if not db_list:
            raise HTTPException(status_code=404, detail="List not found")
        if db_list.is_permanent:
            raise HTTPException(status_code=403, detail="Permanent lists cannot be deleted")
        
        self.task_repo.delete_tasks_by_list(list_id)
        self.task_repo.delete_list(db_list)

    # --- Tasks ---
    def create_task(self, user_id: UUID, task_in: TaskCreate):
        today = datetime.now().date()
        energy_log = self.energy_repo.get_energy_log_by_date(user_id, today)
        
        if not energy_log:
            energy_log = self.energy_repo.create_energy_log(user_id, today)
            
        remaining = energy_log.total_capacity - energy_log.used_capacity
        if task_in.execution and task_in.execution.energy_cost:
            if task_in.execution.energy_cost > remaining:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Not enough energy. Remaining: {remaining}, Required: {task_in.execution.energy_cost}"
                )
                
        task_data = task_in.model_dump()
        task_data["user_id"] = user_id
        
        db_task = self.task_repo.create_task(task_data)
        
        # Deduct energy capacity
        if task_in.execution and task_in.execution.energy_cost:
            energy_log.used_capacity += task_in.execution.energy_cost
            self.energy_repo.update_energy_log(energy_log)
        
        return db_task

    def get_tasks(self, user_id: UUID, status_id: Optional[int] = None, min_energy: Optional[float] = None, list_id: Optional[UUID] = None):
        return self.task_repo.get_tasks_filtered(user_id, list_id, status_id, min_energy)

    def get_task(self, task_id: UUID):
        task = self.task_repo.get_task_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

    def delete_task(self, task_id: UUID):
        db_task = self.task_repo.get_task_by_id(task_id)
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
        self.task_repo.delete_task(db_task)

    def update_task(self, task_id: UUID, task_update: TaskUpdate):
        db_task = self.task_repo.get_task_by_id(task_id)
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        update_data = task_update.model_dump(exclude_unset=True)
        return self.task_repo.update_task(db_task, update_data)
