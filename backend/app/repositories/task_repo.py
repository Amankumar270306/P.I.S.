from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, cast, Date
from uuid import UUID
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.task import Task, TaskList, TaskSchedule, TaskExecution

class TaskRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- Task Lists ---
    def get_lists_by_user(self, user_id: UUID) -> List[TaskList]:
        return self.db.query(TaskList).filter(
            or_(TaskList.user_id == user_id, TaskList.user_id == None)  # noqa: E711
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
        schedule_data = task_data.pop("schedule", None)
        execution_data = task_data.pop("execution", None)
        
        db_task = Task(**task_data)
        if schedule_data:
            db_task.schedule = TaskSchedule(**schedule_data)
        if execution_data:
            db_task.execution = TaskExecution(**execution_data)
            
        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def get_task_by_id(self, task_id: UUID) -> Optional[Task]:
        return self.db.query(Task).options(
            joinedload(Task.schedule),
            joinedload(Task.execution)
        ).filter(Task.id == task_id).first()

    def delete_task(self, db_task: Task) -> None:
        self.db.delete(db_task)
        self.db.commit()

    def update_task(self, db_task: Task, update_data: Dict[str, Any]) -> Task:
        schedule_data = update_data.pop("schedule", None)
        execution_data = update_data.pop("execution", None)
        
        for key, value in update_data.items():
            setattr(db_task, key, value)
            
        if schedule_data is not None:
            if db_task.schedule:
                for key, value in schedule_data.items():
                    setattr(db_task.schedule, key, value)
            else:
                db_task.schedule = TaskSchedule(**schedule_data)
                
        if execution_data is not None:
            if db_task.execution:
                for key, value in execution_data.items():
                    setattr(db_task.execution, key, value)
            else:
                db_task.execution = TaskExecution(**execution_data)

        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def get_tasks_filtered(
        self, 
        user_id: UUID, 
        list_id: Optional[UUID] = None, 
        status_id: Optional[int] = None, 
        min_energy: Optional[float] = None
    ) -> List[Task]:
        
        query = self.db.query(Task).options(
            joinedload(Task.schedule),
            joinedload(Task.execution)
        ).filter(Task.user_id == user_id)
        
        if list_id:
            target_list = self.db.query(TaskList).filter(TaskList.id == list_id).first()
            if target_list and target_list.is_permanent:
                if target_list.name == 'Today':
                    today = datetime.now().date()
                    query = query.join(TaskSchedule, isouter=True).filter(
                        or_(
                            cast(TaskSchedule.deadline, Date) == today,
                            cast(TaskSchedule.scheduled_date, Date) == today
                        )
                    )
                elif target_list.name == 'Scheduled':
                    query = query.join(TaskSchedule, isouter=True).filter(
                        or_(
                            TaskSchedule.scheduled_date != None,
                            TaskSchedule.deadline != None
                        )
                    )
                elif target_list.name == 'Important':
                    query = query.filter(Task.importance == True)
                elif target_list.name == 'Completed':
                    query = query.filter(Task.status_id == 3)
                elif target_list.name == 'All':
                    pass  # No filtering by list necessary
            else:
                query = query.filter(Task.list_id == list_id)
        if status_id:
            query = query.filter(Task.status_id == status_id)
        if min_energy:
            query = query.join(TaskExecution).filter(TaskExecution.energy_cost >= min_energy)
            
        return query.all()

    def count_pending_tasks(self, user_id: UUID) -> int:
        return self.db.query(Task).filter(Task.user_id == user_id, Task.status_id == 1).count()

    def count_overdue_tasks(self, user_id: UUID, current_time: datetime) -> int:
        return self.db.query(Task).join(TaskSchedule).filter(
            Task.user_id == user_id,
            Task.status_id != 3,
            TaskSchedule.deadline < current_time
        ).count()
