from fastapi import FastAPI, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timedelta

import models
import schemas
from database import SessionLocal, engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="P.I.S. AI Engine",
    description="Backend API for Personal Intelligence Scheduler, optimized for AI Agents.",
    version="1.0.0"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import direct_db
app.include_router(direct_db.router)

import uuid as uuid_module
import hashlib

# Middleware to set current_user_id from X-User-Id header
@app.middleware("http")
async def set_user_from_header(request: Request, call_next):
    global current_user_id
    user_id_header = request.headers.get("X-User-Id")
    if user_id_header:
        try:
            current_user_id = uuid_module.UUID(user_id_header)
        except ValueError:
            pass
    response = await call_next(request)
    return response

# --- CRUD Endpoints ---

# Simple password hashing (in production use bcrypt)
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain: str, hashed: str) -> bool:
    return hash_password(plain) == hashed

# Store current user ID (will be set on login)
current_user_id: Optional[uuid_module.UUID] = None

# --- User Authentication Endpoints ---

@app.post("/auth/register", response_model=schemas.UserResponse, summary="Register a new user")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check if email already exists
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if phone already exists
    if user.phone and db.query(models.User).filter(models.User.phone == user.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Create user with hashed password
    db_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone,
        password=hash_password(user.password),
        age=user.age,
        profession=user.profession
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=schemas.UserLoginResponse, summary="Login user")
def login_user(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    global current_user_id
    current_user_id = user.id
    
    return {"user": user, "message": "Login successful"}

@app.get("/auth/me", response_model=schemas.UserResponse, summary="Get current user profile")
def get_current_user(db: Session = Depends(get_db)):
    """Get the currently logged in user's profile."""
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@app.get("/users/{user_id}", response_model=schemas.UserResponse, summary="Get user by ID")
def get_user(user_id: uuid_module.UUID, db: Session = Depends(get_db)):
    """Get user profile by ID."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.patch("/users/{user_id}", response_model=schemas.UserResponse, summary="Update user profile")
def update_user(user_id: uuid_module.UUID, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    """Update user profile information."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user

# Helper to get the active user ID
def get_active_user_id() -> uuid_module.UUID:
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated. Please login first.")
    return current_user_id

# --- Task List Endpoints ---

@app.get("/lists/", response_model=List[schemas.TaskListResponse], summary="List all task lists")
def read_lists(db: Session = Depends(get_db)):
    """Get all task lists for the current user and the permanent global list."""
    user_id = get_active_user_id()
    return db.query(models.TaskList).filter(
        or_(models.TaskList.user_id == user_id, models.TaskList.is_permanent == True)
    ).all()

@app.post("/lists/", response_model=schemas.TaskListResponse, summary="Create a new task list")
def create_list(task_list: schemas.TaskListCreate, db: Session = Depends(get_db)):
    """Create a new temporary task list."""
    data = task_list.model_dump()
    data["is_permanent"] = False
    db_list = models.TaskList(**data)
    db_list.user_id = get_active_user_id()
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list

@app.delete("/lists/{list_id}", summary="Delete a task list")
def delete_list(list_id: uuid_module.UUID, db: Session = Depends(get_db)):
    """Delete a task list and all its tasks, blocked if permanent."""
    db_list = db.query(models.TaskList).filter(models.TaskList.id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="List not found")
    if db_list.is_permanent:
        raise HTTPException(status_code=403, detail="Permanent lists cannot be deleted")
    # Delete associated tasks
    db.query(models.Task).filter(models.Task.list_id == list_id).delete()
    db.delete(db_list)
    db.commit()
    return {"message": "List deleted"}

# --- Task Endpoints ---

@app.post("/tasks/", response_model=schemas.TaskResponse, summary="Create a new task")
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    """
    Creates a new task in the PIS system.
    Checks daily energy limit (90 points max, 1 point = 10 min) before creating.
    Returns the created task with its ID and timestamp.
    """
    today = datetime.now().date()
    
    # Get or create today's energy log
    energy_log = db.query(models.EnergyLog).filter(
        models.EnergyLog.date == today
    ).first()
    
    if not energy_log:
        energy_log = models.EnergyLog(date=today, user_id=get_active_user_id(), total_capacity=90.0, used_capacity=0.0)
        db.add(energy_log)
        db.commit()
        db.refresh(energy_log)
    
    # Check if adding this task would exceed daily limit
    remaining = energy_log.total_capacity - energy_log.used_capacity
    if task.energy_cost > remaining:
        raise HTTPException(
            status_code=400, 
            detail=f"Not enough energy. Remaining: {remaining}, Required: {task.energy_cost}"
        )
    
    # Create the task
    task_data = task.model_dump()
    db_task = models.Task(**task_data)
    db_task.user_id = get_active_user_id()
    
    db.add(db_task)
    
    # Update energy used
    energy_log.used_capacity += task.energy_cost
    db.add(energy_log)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/tasks/", response_model=List[schemas.TaskResponse], summary="List all tasks")
def read_tasks(
    status: Optional[str] = Query(None, description="Filter by task status (e.g., 'todo')"),
    min_energy: Optional[float] = Query(None, description="Filter by minimum energy cost"),
    list_id: Optional[uuid_module.UUID] = Query(None, description="Filter by task list ID"),
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of tasks. 
    Use query parameters to filter results for specific AI context gathering.
    """
    user_id = get_active_user_id()
    query = db.query(models.Task).filter(models.Task.user_id == user_id)
    
    if list_id:
        target_list = db.query(models.TaskList).filter(models.TaskList.id == list_id).first()
        if target_list and target_list.is_permanent:
            name = target_list.name.lower()
            today_start = datetime.combine(datetime.now().date(), datetime.min.time())
            today_end = datetime.combine(datetime.now().date(), datetime.max.time())
            
            if name == "today":
                query = query.filter(
                    (models.Task.deadline >= today_start) & (models.Task.deadline <= today_end) |
                    (models.Task.scheduled_date >= today_start) & (models.Task.scheduled_date <= today_end)
                )
            elif name == "scheduled":
                query = query.filter((models.Task.deadline != None) | (models.Task.scheduled_date != None))
            elif name == "important":
                query = query.filter(models.Task.importance == True)
            elif name == "completed":
                # Filter overriding the `status` if provided, wait, "completed" list overrides query status.
                query = query.filter(models.Task.status == "done")
            elif name == "all":
                pass # Returns all user tasks
        else:
            query = query.filter(models.Task.list_id == list_id)

    if status and not (list_id and target_list and target_list.is_permanent and target_list.name.lower() == "completed"):
        query = query.filter(models.Task.status == status)
    if min_energy:
        query = query.filter(models.Task.energy_cost >= min_energy)
        
    return query.all()

@app.delete("/tasks/{task_id}", summary="Delete a task")
def delete_task(task_id: uuid_module.UUID, db: Session = Depends(get_db)):
    """Delete a task by its ID."""
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted"}

@app.patch("/tasks/{task_id}", response_model=schemas.TaskResponse, summary="Update a task")
def update_task(task_id: uuid_module.UUID, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
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

# --- Daily Energy Endpoints ---

@app.get("/energy/today", summary="Get today's energy status")
def get_today_energy(db: Session = Depends(get_db)):
    """
    Returns today's energy capacity and usage.
    If no log exists for today, creates one with default 90 capacity (15 hours).
    """
    today = datetime.now().date()
    
    energy_log = db.query(models.EnergyLog).filter(
        models.EnergyLog.date == today
    ).first()
    
    if not energy_log:
        energy_log = models.EnergyLog(date=today, user_id=get_active_user_id(), total_capacity=90.0, used_capacity=0.0)
        db.add(energy_log)
        db.commit()
        db.refresh(energy_log)
    
    return {
        "date": str(today),
        "capacity": energy_log.total_capacity,
        "used": energy_log.used_capacity,
        "remaining": energy_log.total_capacity - energy_log.used_capacity
    }

@app.post("/energy/reset", summary="Reset today's energy")
def reset_today_energy(db: Session = Depends(get_db)):
    """
    Resets today's energy used to 0 and sets capacity to 90.
    """
    today = datetime.now().date()
    
    energy_log = db.query(models.EnergyLog).filter(
        models.EnergyLog.date == today
    ).first()
    
    if energy_log:
        energy_log.used_capacity = 0.0
        energy_log.total_capacity = 90.0  # Update to new system
        db.commit()
        db.refresh(energy_log)
    
    return {"message": "Energy reset", "remaining": 90.0}

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

# --- Document Endpoints ---

@app.get("/documents/", response_model=List[schemas.Document], summary="List all documents")
def read_documents(db: Session = Depends(get_db)):
    return db.query(models.Document).all()

@app.post("/documents/", response_model=schemas.Document, summary="Create a new document")
def create_document(doc: schemas.DocumentCreate, db: Session = Depends(get_db)):
    db_doc = models.Document(**doc.model_dump())
    db_doc.user_id = get_active_user_id()
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

@app.get("/documents/{doc_id}", response_model=schemas.Document, summary="Get a document")
def read_document(doc_id: uuid_module.UUID, db: Session = Depends(get_db)):
    db_doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return db_doc

@app.put("/documents/{doc_id}", response_model=schemas.Document, summary="Update a document")
def update_document(doc_id: uuid_module.UUID, doc_update: schemas.DocumentUpdate, db: Session = Depends(get_db)):
    db_doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = doc_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_doc, key, value)
    
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

@app.delete("/documents/{doc_id}", summary="Delete a document")
def delete_document(doc_id: uuid_module.UUID, db: Session = Depends(get_db)):
    db_doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(db_doc)
    db.commit()
    return {"message": "Document deleted"}

# --- Energy Endpoints ---

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



# --- Consistency Graph Endpoints ---

@app.post("/consistency/log", response_model=schemas.ConsistencyLog, summary="Log Daily Consistency")
def create_consistency_log(log: schemas.ConsistencyLogCreate, db: Session = Depends(get_db)):
    """
    Log a daily consistency entry (energy used vs total capacity).
    Each user can only have one log per day (schema constraint).
    """
    # Check if log exists for today
    existing_log = db.query(models.ConsistencyLog).filter(
        models.ConsistencyLog.user_id == log.user_id,
        models.ConsistencyLog.date == log.date.date()
    ).first()

    if existing_log:
        existing_log.energy_used = log.energy_used
        existing_log.total_capacity = log.total_capacity
        db.add(existing_log)
        db.commit()
        db.refresh(existing_log)
        return existing_log

    db_log = models.ConsistencyLog(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/consistency/logs/{user_id}", response_model=List[schemas.ConsistencyLog], summary="Get Consistency History")
def read_consistency_logs(user_id: str, db: Session = Depends(get_db)):
    """
    Get all consistency logs for a specific user to build the graph.
    """
    return db.query(models.ConsistencyLog).filter(models.ConsistencyLog.user_id == user_id).order_by(models.ConsistencyLog.date).all()


