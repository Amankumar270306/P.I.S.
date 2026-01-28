from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

import models
import schemas
from database import SessionLocal, engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="P.I.S. AI Engine",
    description="Backend API for Personal Intelligence Scheduler, optimized for AI Agents.",
    version="1.0.0"
)

# --- CRUD Endpoints ---

@app.post("/tasks/", response_model=schemas.TaskResponse, summary="Create a new task")
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    """
    Creates a new task in the PIS system.
    Returns the created task with its ID and timestamp.
    """
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/tasks/", response_model=List[schemas.TaskResponse], summary="List all tasks")
def read_tasks(
    status: Optional[str] = Query(None, description="Filter by task status (e.g., 'todo')"),
    min_energy: Optional[int] = Query(None, description="Filter by minimum energy cost"),
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of tasks. 
    Use query parameters to filter results for specific AI context gathering.
    """
    query = db.query(models.Task)
    
    if status:
        query = query.filter(models.Task.status == status)
    if min_energy:
        query = query.filter(models.Task.energy_cost >= min_energy)
        
    return query.all()

@app.patch("/tasks/{task_id}", response_model=schemas.TaskResponse, summary="Update a task")
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    """
    Update specific fields of a task.
    """
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

# --- AI Context Endpoint ---

@app.get("/system/state", response_model=schemas.SystemState, summary="Get System Pulse")
def get_system_state(db: Session = Depends(get_db)):
    """
    Returns a high-level summary of the user's current state.
    AI Agents should call this FIRST to understand the cognitive load.
    """
    # Mock Energy Calculation (In a real app, this would come from energy_logs)
    current_energy = 35 
    
    pending_tasks = db.query(models.Task).filter(models.Task.status == "todo").count()
    
    now = datetime.utcnow()
    overdue_tasks = db.query(models.Task).filter(
        models.Task.status != "done",
        models.Task.deadline < now
    ).count()
    
    return {
        "current_energy": current_energy,
        "pending_tasks": pending_tasks,
        "overdue_tasks": overdue_tasks
    }

# --- Integration Endpoints ---

@app.post("/integrations/outlook/webhook", response_model=schemas.IntegrationResponse, summary="Outlook Email Webhook")
def outlook_webhook(payload: schemas.EmailPayload, db: Session = Depends(get_db)):
    """
    Receives email data. If 'Urgent' or 'Deadline' is in the subject, 
    automatically creates a high-priority task.
    """
    keywords = ["Urgent", "Deadline", "ASAP"]
    is_urgent = any(k.lower() in payload.subject.lower() for k in keywords)

    if is_urgent:
        # Create Task
        new_task = models.Task(
            title=f"Email: {payload.subject}",
            energy_cost=7, # Default high cost
            context="ADMIN",
            status="todo"
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        
        return {"action_taken": "task_created", "task_id": new_task.id}
    
    return {"action_taken": "ignored"}

@app.post("/integrations/notion/sync", response_model=schemas.IntegrationResponse, summary="Notion Page Sync")
def notion_sync(payload: schemas.NotionSyncPayload, db: Session = Depends(get_db)):
    """
    Syncs Notion pages to P.I.S. Tasks.
    Only imports 'In Progress' pages that don't exist yet (mock check).
    """
    count = 0
    for page in payload.pages:
        # Simplistic check: Title search. Real world needs Notion ID storage.
        exists = db.query(models.Task).filter(models.Task.title == page.title).first()
        
        if not exists and page.status == "In Progress":
            new_task = models.Task(
                title=page.title,
                energy_cost=5,
                context="DEEP_WORK",
                status="in_progress"
            )
            db.add(new_task)
            count += 1
            
    if count > 0:
        db.commit()
    
    return {"action_taken": f"synced_{count}_tasks"}

@app.post("/energy/log", response_model=schemas.IntegrationResponse, summary="Log Energy Transaction")
def log_energy(payload: schemas.EnergyTransaction, db: Session = Depends(get_db)):
    """
    Logs an energy deduction/addition event.
    Updates the global capacity (mocked) and returns new balance.
    """
    # In a real app, verify user's daily log exists and update it.
    # For now, we mock the calculation based on the requested logic.
    
    current_balance = 35 # Mock starting balance
    new_balance = current_balance + payload.amount
    
    # Optional: Log to DB
    log_entry = models.EnergyLog(
        used=abs(payload.amount),
        reason=payload.reason
    )
    db.add(log_entry)
    db.commit()
    
    return {"action_taken": "energy_updated", "new_balance": new_balance}
