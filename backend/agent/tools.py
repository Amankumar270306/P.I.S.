"""
AI Agent Tools for P.I.S. using LangChain.
These tools allow the AI to interact with the system to manage tasks, read documents, etc.
"""

from langchain_core.tools import tool
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import Optional, List, Annotated
import json
import uuid as uuid_module

# Global database session (set by the agent before invoking)
_db_session: Session = None

def set_db_session(db: Session):
    """Set the database session for tools to use."""
    global _db_session
    _db_session = db

def get_db():
    """Get the current database session."""
    global _db_session
    if _db_session is None:
        raise RuntimeError("Database session not set. Call set_db_session first.")
    return _db_session


@tool
def create_task(
    title: Annotated[str, "The task title"],
    energy_cost: Annotated[int, "Energy cost 1-10, default 5"] = 5,
    priority: Annotated[str, "Priority: High, Medium, or Low"] = "Medium",
    context: Annotated[Optional[str], "Additional notes"] = None,
    deadline: Annotated[Optional[str], "Deadline in ISO format"] = None,
    scheduled_date: Annotated[Optional[str], "Scheduled date in ISO format"] = None,
    importance: Annotated[bool, "Is this important?"] = False,
    is_urgent: Annotated[bool, "Is this urgent?"] = False
) -> str:
    """Create a new task with the given details."""
    import models
    from main import DEFAULT_USER_ID
    
    db = get_db()
    try:
        deadline_dt = datetime.fromisoformat(deadline) if deadline else None
        scheduled_dt = datetime.fromisoformat(scheduled_date) if scheduled_date else None
        
        new_task = models.Task(
            title=title,
            energy_cost=min(max(energy_cost, 1), 10),
            priority=priority if priority in ["High", "Medium", "Low"] else "Medium",
            context=context,
            deadline=deadline_dt,
            scheduled_date=scheduled_dt,
            importance=importance,
            is_urgent=is_urgent,
            status="todo",
            user_id=DEFAULT_USER_ID
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        
        return f"Task '{title}' created successfully (ID: {new_task.id}, Energy: {new_task.energy_cost})"
    except Exception as e:
        db.rollback()
        return f"Error creating task: {str(e)}"


@tool
def delete_task(task_id: Annotated[str, "The task UUID to delete"]) -> str:
    """Delete a task by its ID."""
    import models
    
    db = get_db()
    try:
        task = db.query(models.Task).filter(models.Task.id == uuid_module.UUID(task_id)).first()
        if not task:
            return "Task not found"
        
        title = task.title
        db.delete(task)
        db.commit()
        return f"Task '{title}' deleted successfully"
    except Exception as e:
        db.rollback()
        return f"Error deleting task: {str(e)}"


@tool
def update_task(
    task_id: Annotated[str, "The task UUID"],
    title: Annotated[Optional[str], "New title"] = None,
    status: Annotated[Optional[str], "New status: todo, in_progress, done, backlog"] = None,
    priority: Annotated[Optional[str], "New priority: High, Medium, Low"] = None,
    importance: Annotated[Optional[bool], "Is important?"] = None,
    is_urgent: Annotated[Optional[bool], "Is urgent?"] = None
) -> str:
    """Update an existing task's properties."""
    import models
    
    db = get_db()
    try:
        task = db.query(models.Task).filter(models.Task.id == uuid_module.UUID(task_id)).first()
        if not task:
            return "Task not found"
        
        if title: task.title = title
        if status and status in ["todo", "in_progress", "done", "backlog"]: task.status = status
        if priority and priority in ["High", "Medium", "Low"]: task.priority = priority
        if importance is not None: task.importance = importance
        if is_urgent is not None: task.is_urgent = is_urgent
        
        db.commit()
        return f"Task '{task.title}' updated successfully"
    except Exception as e:
        db.rollback()
        return f"Error updating task: {str(e)}"


@tool
def get_tasks(
    status: Annotated[Optional[str], "Filter by status: todo, in_progress, done, backlog"] = None,
    priority: Annotated[Optional[str], "Filter by priority: High, Medium, Low"] = None,
    today_only: Annotated[bool, "Only show today's scheduled tasks"] = False,
    limit: Annotated[int, "Max number of results"] = 10
) -> str:
    """Get tasks with optional filters."""
    import models
    
    db = get_db()
    try:
        query = db.query(models.Task)
        
        if status:
            query = query.filter(models.Task.status == status)
        if priority:
            query = query.filter(models.Task.priority == priority)
        if today_only:
            today = date.today()
            query = query.filter(models.Task.scheduled_date == today)
        
        tasks = query.order_by(models.Task.created_at.desc()).limit(limit).all()
        
        if not tasks:
            return "No tasks found matching the criteria."
        
        result = []
        for t in tasks:
            result.append(f"- {t.title} [{t.status}] (Priority: {t.priority}, Energy: {t.energy_cost})")
        
        return f"Found {len(tasks)} tasks:\n" + "\n".join(result)
    except Exception as e:
        return f"Error fetching tasks: {str(e)}"


@tool
def get_documents(limit: Annotated[int, "Max number of documents"] = 10) -> str:
    """Get list of documents from the Brain."""
    import models
    
    db = get_db()
    try:
        docs = db.query(models.Document).order_by(models.Document.last_edited.desc()).limit(limit).all()
        
        if not docs:
            return "No documents found in the Brain."
        
        result = []
        for d in docs:
            preview = str(d.content)[:50] + "..." if d.content else "Empty"
            result.append(f"- {d.title} (ID: {d.id}): {preview}")
        
        return f"Found {len(docs)} documents:\n" + "\n".join(result)
    except Exception as e:
        return f"Error fetching documents: {str(e)}"


@tool
def get_document_content(doc_id: Annotated[str, "The document UUID"]) -> str:
    """Get the full content of a specific document."""
    import models
    
    db = get_db()
    try:
        doc = db.query(models.Document).filter(models.Document.id == uuid_module.UUID(doc_id)).first()
        if not doc:
            return "Document not found"
        
        return f"**{doc.title}**\n\n{doc.content or 'No content'}"
    except Exception as e:
        return f"Error fetching document: {str(e)}"


@tool
def get_energy_status() -> str:
    """Get today's energy capacity and usage."""
    import models
    from main import DEFAULT_USER_ID
    
    db = get_db()
    try:
        today = date.today()
        log = db.query(models.EnergyLog).filter(models.EnergyLog.date == today).first()
        
        if not log:
            return f"Energy Status for {today}: 0/30 used (30 remaining)"
        
        remaining = log.total_capacity - log.used_capacity
        return f"Energy Status for {today}: {log.used_capacity}/{log.total_capacity} used ({remaining} remaining)"
    except Exception as e:
        return f"Error fetching energy status: {str(e)}"


@tool
def get_task_lists() -> str:
    """Get all available task lists."""
    import models
    
    db = get_db()
    try:
        lists = db.query(models.TaskList).all()
        
        if not lists:
            return "No task lists found."
        
        result = []
        for l in lists:
            result.append(f"- {l.name} (ID: {l.id}, Color: {l.color})")
        
        return f"Found {len(lists)} task lists:\n" + "\n".join(result)
    except Exception as e:
        return f"Error fetching task lists: {str(e)}"


@tool
def add_calendar_event(
    description: Annotated[str, "Event description"],
    event_date: Annotated[str, "Date in YYYY-MM-DD format"],
    event_time: Annotated[str, "Time in HH:MM format"]
) -> str:
    """Add a calendar event/task with specific date and time."""
    import models
    from main import DEFAULT_USER_ID
    
    db = get_db()
    try:
        scheduled_dt = datetime.strptime(f"{event_date} {event_time}", "%Y-%m-%d %H:%M")
        
        new_task = models.Task(
            title=description,
            energy_cost=3,
            priority="Medium",
            scheduled_date=scheduled_dt.date(),
            started_at=scheduled_dt,
            status="todo",
            user_id=DEFAULT_USER_ID
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        
        return f"Calendar event '{description}' added for {event_date} at {event_time}"
    except Exception as e:
        db.rollback()
        return f"Error adding calendar event: {str(e)}"


# List of all tools for the agent
ALL_TOOLS = [
    create_task,
    delete_task,
    update_task,
    get_tasks,
    get_documents,
    get_document_content,
    get_energy_status,
    get_task_lists,
    add_calendar_event
]
