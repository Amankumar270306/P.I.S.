"""
AI Agent Tools for P.I.S.
These tools allow the AI to interact with the system to manage tasks, read documents, etc.
"""

from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import Optional, List
import json
import models
import uuid as uuid_module


def create_task(
    db: Session,
    title: str,
    energy_cost: int = 5,
    priority: str = "Medium",
    context: str = None,
    deadline: str = None,
    scheduled_date: str = None,
    started_at: str = None,
    ended_at: str = None,
    importance: bool = False,
    is_urgent: bool = False,
    list_id: str = None
) -> dict:
    """
    Create a new task with all available options.
    
    Args:
        title: The task title (required)
        energy_cost: Energy cost 1-10 (default 5)
        priority: "High", "Medium", or "Low"
        context: Additional context/notes
        deadline: ISO format deadline date
        scheduled_date: ISO format scheduled date
        started_at: ISO format start time
        ended_at: ISO format end time
        importance: Is this important?
        is_urgent: Is this urgent?
        list_id: Optional task list UUID
    """
    try:
        # Parse dates if provided
        deadline_dt = datetime.fromisoformat(deadline) if deadline else None
        scheduled_dt = datetime.fromisoformat(scheduled_date) if scheduled_date else None
        started_dt = datetime.fromisoformat(started_at) if started_at else None
        ended_dt = datetime.fromisoformat(ended_at) if ended_at else None
        list_uuid = uuid_module.UUID(list_id) if list_id else None
        
        new_task = models.Task(
            title=title,
            energy_cost=min(max(energy_cost, 1), 10),
            priority=priority if priority in ["High", "Medium", "Low"] else "Medium",
            context=context,
            deadline=deadline_dt,
            scheduled_date=scheduled_dt,
            started_at=started_dt,
            ended_at=ended_dt,
            importance=importance,
            is_urgent=is_urgent,
            list_id=list_uuid,
            status="todo"
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        
        return {
            "success": True,
            "message": f"Task '{title}' created successfully",
            "task_id": str(new_task.id),
            "energy_cost": new_task.energy_cost
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}


def delete_task(db: Session, task_id: str) -> dict:
    """Delete a task by its ID."""
    try:
        task = db.query(models.Task).filter(models.Task.id == uuid_module.UUID(task_id)).first()
        if not task:
            return {"success": False, "error": "Task not found"}
        
        title = task.title
        db.delete(task)
        db.commit()
        return {"success": True, "message": f"Task '{title}' deleted"}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}


def update_task(
    db: Session,
    task_id: str,
    title: str = None,
    status: str = None,
    energy_cost: int = None,
    priority: str = None,
    deadline: str = None,
    scheduled_date: str = None,
    importance: bool = None,
    is_urgent: bool = None
) -> dict:
    """Update an existing task."""
    try:
        task = db.query(models.Task).filter(models.Task.id == uuid_module.UUID(task_id)).first()
        if not task:
            return {"success": False, "error": "Task not found"}
        
        if title: task.title = title
        if status and status in ["todo", "in_progress", "done", "backlog"]: task.status = status
        if energy_cost: task.energy_cost = min(max(energy_cost, 1), 10)
        if priority and priority in ["High", "Medium", "Low"]: task.priority = priority
        if deadline: task.deadline = datetime.fromisoformat(deadline)
        if scheduled_date: task.scheduled_date = datetime.fromisoformat(scheduled_date)
        if importance is not None: task.importance = importance
        if is_urgent is not None: task.is_urgent = is_urgent
        
        db.commit()
        return {"success": True, "message": f"Task '{task.title}' updated"}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}


def get_tasks(
    db: Session,
    status: str = None,
    priority: str = None,
    today_only: bool = False,
    limit: int = 10
) -> dict:
    """Get tasks with optional filtering."""
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
        
        return {
            "success": True,
            "count": len(tasks),
            "tasks": [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "status": t.status,
                    "priority": t.priority,
                    "energy_cost": t.energy_cost,
                    "deadline": t.deadline.isoformat() if t.deadline else None,
                    "scheduled_date": t.scheduled_date.isoformat() if t.scheduled_date else None,
                    "importance": t.importance,
                    "is_urgent": t.is_urgent
                }
                for t in tasks
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_documents(db: Session, limit: int = 10) -> dict:
    """Get all documents from the Brain."""
    try:
        docs = db.query(models.Document).order_by(models.Document.last_edited.desc()).limit(limit).all()
        
        return {
            "success": True,
            "count": len(docs),
            "documents": [
                {
                    "id": str(d.id),
                    "title": d.title,
                    "created_at": d.created_at.isoformat() if d.created_at else None,
                    "last_edited": d.last_edited.isoformat() if d.last_edited else None,
                    "content_preview": str(d.content)[:200] if d.content else "Empty"
                }
                for d in docs
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_document_content(db: Session, doc_id: str) -> dict:
    """Get full content of a specific document."""
    try:
        doc = db.query(models.Document).filter(models.Document.id == uuid_module.UUID(doc_id)).first()
        if not doc:
            return {"success": False, "error": "Document not found"}
        
        return {
            "success": True,
            "document": {
                "id": str(doc.id),
                "title": doc.title,
                "content": doc.content,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
                "last_edited": doc.last_edited.isoformat() if doc.last_edited else None
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def create_linked_task(
    db: Session,
    title: str,
    description: str = None,
    source_doc_id: str = None
) -> dict:
    """Create a linked task from document context."""
    try:
        linked = models.LinkedTask(
            title=title,
            description=description,
            source_type="document",
            source_doc_id=uuid_module.UUID(source_doc_id) if source_doc_id else None,
            status="pending"
        )
        db.add(linked)
        db.commit()
        db.refresh(linked)
        
        return {
            "success": True,
            "message": f"Linked task '{title}' created",
            "linked_task_id": str(linked.id)
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}


def get_energy_status(db: Session) -> dict:
    """Get today's energy status."""
    try:
        today = date.today()
        log = db.query(models.EnergyLog).filter(models.EnergyLog.date == today).first()
        
        if not log:
            # Create today's log
            log = models.EnergyLog(date=today, capacity=30, used=0)
            db.add(log)
            db.commit()
            db.refresh(log)
        
        return {
            "success": True,
            "date": str(today),
            "capacity": log.capacity,
            "used": log.used,
            "remaining": log.capacity - log.used
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_task_lists(db: Session) -> dict:
    """Get all task lists."""
    try:
        lists = db.query(models.TaskList).all()
        return {
            "success": True,
            "lists": [
                {"id": str(l.id), "name": l.name, "color": l.color}
                for l in lists
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Tool definitions for LLM function calling
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a new task with title, energy cost, priority, deadline, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Task title"},
                    "energy_cost": {"type": "integer", "description": "Energy cost 1-10, default 5"},
                    "priority": {"type": "string", "enum": ["High", "Medium", "Low"], "description": "Priority level"},
                    "context": {"type": "string", "description": "Additional notes"},
                    "deadline": {"type": "string", "description": "Deadline in ISO format (YYYY-MM-DDTHH:MM:SS)"},
                    "scheduled_date": {"type": "string", "description": "Scheduled date in ISO format"},
                    "importance": {"type": "boolean", "description": "Is this important?"},
                    "is_urgent": {"type": "boolean", "description": "Is this urgent?"}
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Delete a task by its ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string", "description": "The task UUID to delete"}
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update an existing task's properties",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string", "description": "The task UUID"},
                    "title": {"type": "string"},
                    "status": {"type": "string", "enum": ["todo", "in_progress", "done", "backlog"]},
                    "priority": {"type": "string", "enum": ["High", "Medium", "Low"]},
                    "deadline": {"type": "string"},
                    "importance": {"type": "boolean"},
                    "is_urgent": {"type": "boolean"}
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_tasks",
            "description": "Get tasks with optional filters",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["todo", "in_progress", "done", "backlog"]},
                    "priority": {"type": "string", "enum": ["High", "Medium", "Low"]},
                    "today_only": {"type": "boolean", "description": "Only show today's scheduled tasks"},
                    "limit": {"type": "integer", "description": "Max number of results"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_documents",
            "description": "Get list of documents from the Brain",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Max number of documents"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_document_content",
            "description": "Get the full content of a specific document",
            "parameters": {
                "type": "object",
                "properties": {
                    "doc_id": {"type": "string", "description": "The document UUID"}
                },
                "required": ["doc_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_linked_task",
            "description": "Create a linked task from document context",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Task title"},
                    "description": {"type": "string", "description": "Task description"},
                    "source_doc_id": {"type": "string", "description": "Source document UUID"}
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_energy_status",
            "description": "Get today's energy capacity and usage",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_task_lists",
            "description": "Get all available task lists",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]


def execute_tool(db: Session, tool_name: str, arguments: dict) -> dict:
    """Execute a tool by name with given arguments."""
    tool_map = {
        "create_task": lambda: create_task(db, **arguments),
        "delete_task": lambda: delete_task(db, **arguments),
        "update_task": lambda: update_task(db, **arguments),
        "get_tasks": lambda: get_tasks(db, **arguments),
        "get_documents": lambda: get_documents(db, **arguments),
        "get_document_content": lambda: get_document_content(db, **arguments),
        "create_linked_task": lambda: create_linked_task(db, **arguments),
        "get_energy_status": lambda: get_energy_status(db),
        "get_task_lists": lambda: get_task_lists(db)
    }
    
    if tool_name in tool_map:
        return tool_map[tool_name]()
    else:
        return {"success": False, "error": f"Unknown tool: {tool_name}"}
