from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
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

# --- Document Endpoints ---

@app.get("/documents/", response_model=List[schemas.Document], summary="List all documents")
def read_documents(db: Session = Depends(get_db)):
    return db.query(models.Document).all()

@app.post("/documents/", response_model=schemas.Document, summary="Create a new document")
def create_document(doc: schemas.DocumentCreate, db: Session = Depends(get_db)):
    db_doc = models.Document(**doc.model_dump())
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

@app.get("/documents/{doc_id}", response_model=schemas.Document, summary="Get a document")
def read_document(doc_id: int, db: Session = Depends(get_db)):
    db_doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return db_doc

@app.put("/documents/{doc_id}", response_model=schemas.Document, summary="Update a document")
def update_document(doc_id: int, doc_update: schemas.DocumentUpdate, db: Session = Depends(get_db)):
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
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    db_doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(db_doc)
    db.commit()
    return {"message": "Document deleted"}

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

# --- Auto-Scheduler ---

import logic.scheduler as scheduler
from datetime import date

@app.post("/schedule/auto-plan", summary="Auto-Optimize Schedule")
def auto_plan(db: Session = Depends(get_db)):
    """
    AI-driven scheduling. Rearranges tasks based on energy, deadline, and priority.
    """
    # 1. Fetch Candidates (Todo tasks)
    tasks = db.query(models.Task).filter(models.Task.status == "todo").all()
    
    # 2. Run Algorithm
    # Mock daily limit, ideally fetch from EnergyLog
    scheduled, backlog = scheduler.optimize_schedule(tasks, daily_limit=40)
    
    # 3. Apply Changes
    today = date.today()
    tomorrow = today + timedelta(days=1)
    
    for t in scheduled:
        t.scheduled_date = today
        db.add(t)
        
    for t in backlog:
        # Push to backlog/tomorrow (or just clear scheduled_date)
        t.scheduled_date = tomorrow
        db.add(t)
        
    db.commit()
    
    return {
        "scheduled_count": len(scheduled),
        "backlog_count": len(backlog),
        "message": "Schedule optimized successfully."
    }

# --- AI Agent Chat ---

import agent.chat as agent_chat
import uuid

@app.post("/agent/chat", response_model=schemas.ChatResponse, summary="Chat with P.I.S. Agent")
def chat_endpoint(payload: schemas.ChatRequest, db: Session = Depends(get_db)):
    """
    Ask the AI agent questions about your schedule or energy.
    """
    response_text = agent_chat.chat_with_agent(payload.message, db)
    return {"response": response_text}

# --- Team Chat Endpoints ---

from fastapi import WebSocket, WebSocketDisconnect
import chat_ws
import uuid

@app.post("/chat/users", response_model=schemas.User)
def create_chat_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(username=user.username, avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.username}")
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/chat/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.get("/chat/channels", response_model=List[schemas.Channel])
def get_channels(db: Session = Depends(get_db)):
    # Simple implementation: Return all channels
    # In real app: Return only channels user is part of
    return db.query(models.Channel).all()

@app.post("/chat/channels", response_model=schemas.Channel)
def create_channel(channel: schemas.ChannelBase, db: Session = Depends(get_db)):
    db_channel = models.Channel(name=channel.name, is_group=channel.is_group)
    db.add(db_channel)
    db.commit()
    db.refresh(db_channel)
    return db_channel

@app.get("/chat/history/{channel_id}", response_model=List[schemas.Message])
def get_chat_history(channel_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(models.Message).filter(models.Message.channel_id == channel_id).order_by(models.Message.created_at).all()

@app.websocket("/ws/chat/{channel_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, channel_id: str, user_id: str, db: Session = Depends(get_db)):
    await chat_ws.manager.connect(websocket, channel_id)
    try:
        while True:
            data = await websocket.receive_json()
            # data expects: { "content": "hello" }
            
            content = data.get("content")
            if content:
                # 1. Persist to DB
                # Note: We need a new session context here usually for async, 
                # but FastAPI dependency injection handles it for this scope if not async DB.
                # Since SQLAlchemy with standard engine is blocking, we should be careful.
                # For this prototype, we'll try direct usage. If it blocks event loop, we'd need run_in_executor.
                
                new_msg = models.Message(
                    channel_id=uuid.UUID(channel_id),
                    sender_id=uuid.UUID(user_id),
                    content=content
                )
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)
                
                # 2. Broadcast with metadata
                msg_response = {
                    "id": str(new_msg.id),
                    "content": new_msg.content,
                    "sender_id": str(new_msg.sender_id),
                    "created_at": new_msg.created_at.isoformat(),
                    "channel_id": str(new_msg.channel_id)
                }
                
                await chat_ws.manager.broadcast(msg_response, channel_id)
                
    except WebSocketDisconnect:
        chat_ws.manager.disconnect(websocket, channel_id)
    except Exception as e:
        print(f"WS Error: {e}")
        chat_ws.manager.disconnect(websocket, channel_id)
