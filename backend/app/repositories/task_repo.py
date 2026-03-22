from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.task import Task, TaskList

class TaskRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- Task Lists ---
    def get_lists_by_user(self, user_id: UUID) -> List[TaskList]:
        return self.db.query(TaskList).filter(
            or_(TaskList.user_id == user_id, TaskList.is_permanent == True)
        ).all()

    def get_list_by_id(self, list_id: UUID) -> Optional[TaskList]:
        return self.db.query(TaskList).filter(TaskList.id == list_id).first()

    def create_list(self, list_data: Dict[str, Any]) -> TaskList:
        db_list = TaskList(**list_data)
        self.db.add(db_list)
        self.db.commit()
        self.db.refresh(db_list)
        return db_list

    def delete_list(self, db_list: TaskList) -> None:
        self.db.delete(db_list)
        self.db.commit()

    def delete_tasks_by_list(self, list_id: UUID) -> None:
        self.db.query(Task).filter(Task.list_id == list_id).delete()
        self.db.commit()

    # --- Tasks ---
    def create_task(self, task_data: Dict[str, Any]) -> Task:
        db_task = Task(**task_data)
        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def get_task_by_id(self, task_id: UUID) -> Optional[Task]:
        return self.db.query(Task).filter(Task.id == task_id).first()

    def delete_task(self, db_task: Task) -> None:
        self.db.delete(db_task)
        self.db.commit()

    def update_task(self, db_task: Task, update_data: Dict[str, Any]) -> Task:
        for key, value in update_data.items():
            setattr(db_task, key, value)
        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def get_tasks_filtered(
        self, 
        user_id: UUID, 
        list_id: Optional[UUID] = None, 
        status: Optional[str] = None, 
        min_energy: Optional[float] = None
    ) -> List[Task]:
        
        query = self.db.query(Task).filter(Task.user_id == user_id)
        
        target_list = None
        if list_id:
            target_list = self.get_list_by_id(list_id)
            if target_list and target_list.is_permanent:
                name = target_list.name.lower()
                today_start = datetime.combine(datetime.now().date(), datetime.min.time())
                today_end = datetime.combine(datetime.now().date(), datetime.max.time())
                
                if name == "today":
                    query = query.filter(
                        (Task.deadline >= today_start) & (Task.deadline <= today_end) |
                        (Task.scheduled_date >= today_start) & (Task.scheduled_date <= today_end)
                    )
                elif name == "scheduled":
                    query = query.filter((Task.deadline != None) | (Task.scheduled_date != None))
                elif name == "important":
                    query = query.filter(Task.importance == True)
                elif name == "completed":
                    query = query.filter(Task.status == "done")
                elif name == "all":
                    pass 
            else:
                query = query.filter(Task.list_id == list_id)

        if status and not (target_list and target_list.is_permanent and target_list.name.lower() == "completed"):
            query = query.filter(Task.status == status)
        if min_energy:
            query = query.filter(Task.energy_cost >= min_energy)
            
        return query.all()

    def count_pending_tasks(self, user_id: UUID) -> int:
        return self.db.query(Task).filter(Task.user_id == user_id, Task.status == "todo").count()

    def count_overdue_tasks(self, user_id: UUID, current_time: datetime) -> int:
        return self.db.query(Task).filter(
            Task.user_id == user_id,
            Task.status != "done",
            Task.deadline < current_time
        ).count()
