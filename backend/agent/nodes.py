"""
LangGraph Nodes for Multi-Model System.
Each node uses a specific model for its responsibility.
"""

import os
import json
from typing import Optional, List, Annotated
from sqlalchemy.orm import Session
from datetime import date, datetime
import operator

from langchain_ollama import ChatOllama
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage
from typing import TypedDict

import models
from agent.router import RouterOutput
from agent.tools import ALL_TOOLS, set_db_session, get_db
from main import DEFAULT_USER_ID


# ===== STATE DEFINITION =====

class AgentState(TypedDict):
    """State shared across all nodes."""
    messages: Annotated[List[BaseMessage], operator.add]
    user_input: str
    route: Optional[RouterOutput]
    tool_results: Optional[List[str]]
    final_response: Optional[str]


# ===== FAST TASK NODE (phi3:mini) =====

FAST_TASK_PROMPT = """You are a fast task executor. Execute the requested action and respond with JSON.

Available actions:
- create: Create a new task
- update: Update existing task
- delete: Delete a task
- list: List tasks
- complete: Mark task as done

Database tools available:
{tools_desc}

For task creation, extract:
- title (required)
- energy_cost (0.5-90, where 1 point = 10 minutes, default 3.0)
- priority (High/Medium/Low, default Medium)

OUTPUT FORMAT:
{{
  "action": "create|update|delete|list|complete",
  "result": "description of what was done",
  "data": {{...task data if applicable...}}
}}

Be concise. Execute only what's asked."""


def create_fast_task_llm():
    """Create phi3:mini for fast task execution."""
    base_url = os.getenv("AI_MODEL_URL", "http://localhost:11434")
    if "/v1" in base_url:
        base_url = base_url.split("/v1")[0]
    
    return ChatOllama(
        model="phi3:mini",
        base_url=base_url,
        temperature=0.1,
        format="json"
    )


def fast_task_node(state: AgentState, db: Session) -> dict:
    """
    Execute fast CRUD operations on tasks.
    Uses phi3:mini for speed.
    """
    import re
    
    set_db_session(db)
    route = state.get("route")
    user_input = state.get("user_input", "")
    
    # Direct execution based on action
    action = route.action if route else None
    title = route.title if route else None
    
    result = ""
    
    try:
        # If no title extracted from router, try to extract from user input
        if action == "create" and not title:
            # Extract task description from common patterns
            patterns = [
                r"(?:assign|schedule|set|add|create)\s+(?:a\s+)?(meeting|task|event|call|appointment)(?:\s+(?:of|for|with|about|to)\s+(.+?))?(?:\s+(?:from|at|on)\s+\d|$|\s+as\s+a\s+task)",
                r"(?:add|create)\s+(?:a\s+)?(?:task|meeting|event)?\s*(?:to|for|of|:)?\s*(.+?)(?:\s+(?:from|at|on)\s+\d|$)",
                r"(?:remind me to|i need to)\s+(.+?)(?:\s+(?:from|at|on)\s+\d|$)",
            ]
            for pattern in patterns:
                match = re.search(pattern, user_input, re.IGNORECASE)
                if match:
                    groups = match.groups()
                    # Combine non-None groups
                    title_parts = [g for g in groups if g]
                    title = " ".join(title_parts).strip() if title_parts else None
                    break
            
            # Clean up title - remove time patterns from title
            if title:
                title = re.sub(r"\s*(from|at)\s+\d{1,2}\s*(pm|am)?\s*(to\s+\d{1,2}\s*(pm|am)?)?", "", title, flags=re.IGNORECASE).strip()
                title = re.sub(r"\s+as\s+a\s+task.*$", "", title, flags=re.IGNORECASE).strip()
            
            if not title:
                # Last fallback: use common noun from input
                for word in ["meeting", "call", "task", "event", "appointment"]:
                    if word in user_input.lower():
                        title = word.capitalize()
                        break
            if not title:
                title = "New Task"
        
        # Extract time if mentioned (e.g., "from 1 to 4", "at 2pm", "1pm-4pm")
        start_time = None
        end_time = None
        time_patterns = [
            r"from\s+(\d{1,2})\s*(?:pm|am)?\s*to\s+(\d{1,2})\s*(?:pm|am)?",
            r"(\d{1,2})\s*(?:pm|am)?\s*-\s*(\d{1,2})\s*(?:pm|am)?",
            r"at\s+(\d{1,2})\s*(?:pm|am)?",
        ]
        for pattern in time_patterns:
            match = re.search(pattern, user_input, re.IGNORECASE)
            if match:
                if len(match.groups()) >= 2:
                    start_time = int(match.group(1))
                    end_time = int(match.group(2))
                    # Assume PM if hour is small (like 1-4)
                    if start_time < 12 and "am" not in user_input.lower():
                        start_time += 12
                    if end_time < 12 and "am" not in user_input.lower():
                        end_time += 12
                else:
                    start_time = int(match.group(1))
                    if start_time < 12 and "am" not in user_input.lower():
                        start_time += 12
                break
        
        if action == "create" and title:
            # Build context with time info
            context = None
            if start_time and end_time:
                context = f"Scheduled: {start_time}:00 - {end_time}:00"
            elif start_time:
                context = f"Scheduled: {start_time}:00"
            
            # Create task
            today = date.today()
            new_task = models.Task(
                title=title[:100],  # Limit title length
                energy_cost=3.0,
                priority="Medium",
                status="todo",
                user_id=DEFAULT_USER_ID,
                context=context,
                scheduled_date=today if start_time else None,
                started_at=datetime(today.year, today.month, today.day, start_time, 0) if start_time else None,
                ended_at=datetime(today.year, today.month, today.day, end_time, 0) if end_time else None
            )
            db.add(new_task)
            db.commit()
            db.refresh(new_task)
            
            time_str = ""
            if start_time and end_time:
                time_str = f" from {start_time}:00 to {end_time}:00"
            elif start_time:
                time_str = f" at {start_time}:00"
            
            result = f"✅ Task created: **{title}**{time_str}"
            
        elif action == "list":
            tasks = db.query(models.Task).filter(
                models.Task.status != "done"
            ).order_by(models.Task.created_at.desc()).limit(10).all()
            
            if tasks:
                task_list = "\n".join([
                    f"• {t.title} [{t.status}] - {t.priority} priority"
                    for t in tasks
                ])
                result = f"📋 Your tasks:\n{task_list}"
            else:
                result = "No pending tasks found."
                
        elif action == "complete" and title:
            task = db.query(models.Task).filter(
                models.Task.title.ilike(f"%{title}%")
            ).first()
            if task:
                task.status = "done"
                db.commit()
                result = f"✅ Marked '{task.title}' as done!"
            else:
                result = f"Could not find task matching '{title}'"
                
        elif action == "delete" and title:
            task = db.query(models.Task).filter(
                models.Task.title.ilike(f"%{title}%")
            ).first()
            if task:
                db.delete(task)
                db.commit()
                result = f"🗑️ Deleted task: '{task.title}'"
            else:
                result = f"Could not find task matching '{title}'"
        
        elif action == "delete_all" or ("delete" in user_input.lower() and "all" in user_input.lower()):
            # Delete all tasks
            count = db.query(models.Task).filter(
                models.Task.user_id == DEFAULT_USER_ID
            ).count()
            if count > 0:
                db.query(models.Task).filter(
                    models.Task.user_id == DEFAULT_USER_ID
                ).delete()
                db.commit()
                result = f"🗑️ Deleted all {count} tasks!"
            else:
                result = "No tasks to delete."
        
        elif action == "delete":
            # Delete without specific title - try to extract from input
            match = re.search(r"(?:delete|remove)\s+(?:the\s+)?(.+?)(?:\s+task)?$", user_input, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                task = db.query(models.Task).filter(
                    models.Task.title.ilike(f"%{title}%")
                ).first()
                if task:
                    db.delete(task)
                    db.commit()
                    result = f"🗑️ Deleted task: '{task.title}'"
                else:
                    result = f"Could not find task matching '{title}'"
            else:
                result = "Please specify which task to delete, e.g., 'delete meeting task'"
                
        else:
            # Fallback: detect intent from keywords
            user_lower = user_input.lower()
            
            # Check for delete intent first
            if any(word in user_lower for word in ["delete", "remove", "clear"]):
                if "all" in user_lower:
                    count = db.query(models.Task).filter(
                        models.Task.user_id == DEFAULT_USER_ID
                    ).count()
                    if count > 0:
                        db.query(models.Task).filter(
                            models.Task.user_id == DEFAULT_USER_ID
                        ).delete()
                        db.commit()
                        result = f"🗑️ Deleted all {count} tasks!"
                    else:
                        result = "No tasks to delete."
                else:
                    result = "Please specify which task to delete, or say 'delete all tasks'"
            
            # Check for create intent
            elif any(word in user_lower for word in ["add", "create", "assign", "schedule"]):
                title = re.sub(r"^(add|create|assign|schedule|set)\s+(a\s+)?(task|meeting|event)?\s*(to|for|of|:)?\s*", "", user_input, flags=re.IGNORECASE).strip()
                if title:
                    new_task = models.Task(
                        title=title[:100],
                        energy_cost=3.0,
                        priority="Medium",
                        status="todo",
                        user_id=DEFAULT_USER_ID
                    )
                    db.add(new_task)
                    db.commit()
                    db.refresh(new_task)
                    result = f"✅ Task created: **{title}**"
                else:
                    result = "I couldn't understand the task. Please try: 'add task [task name]'"
            else:
                result = "I'm not sure what you want. Try: 'add task [name]', 'list tasks', or 'delete all tasks'"
            
    except Exception as e:
        result = f"Error: {str(e)}"
        db.rollback()
    
    return {
        "messages": [AIMessage(content=result)],
        "final_response": result
    }


# ===== REASONING NODE (llama3.1:8b) =====

REASONING_PROMPT = """You are a planning and reasoning AI assistant.

Your job:
1. Analyze the user's request
2. Create a structured plan
3. Output tasks to execute

Current context:
- Date: {date}
- Pending tasks: {pending_count}
- Energy remaining: {energy_remaining}

For scheduling and planning:
- Break down goals into actionable tasks
- Prioritize using Eisenhower matrix (urgent/important)
- Consider energy costs (1-10)

OUTPUT FORMAT:
{{
  "analysis": "your reasoning about the request",
  "plan": [
    {{"title": "task 1", "priority": "High", "energy": 5}},
    {{"title": "task 2", "priority": "Medium", "energy": 3}}
  ],
  "response": "human-readable response to user"
}}

Be thorough but concise."""


def create_reasoning_llm():
    """Create llama3.1 for reasoning."""
    base_url = os.getenv("AI_MODEL_URL", "http://localhost:11434")
    if "/v1" in base_url:
        base_url = base_url.split("/v1")[0]
    
    return ChatOllama(
        model="llama3.1:latest",
        base_url=base_url,
        temperature=0.7
    )


def reasoning_node(state: AgentState, db: Session) -> dict:
    """
    Handle complex planning and reasoning.
    Uses llama3.1:8b.
    """
    user_input = state.get("user_input", "")
    
    # Get context
    today = date.today()
    pending_count = db.query(models.Task).filter(models.Task.status == "todo").count()
    
    energy_log = db.query(models.EnergyLog).filter(models.EnergyLog.date == today).first()
    energy_remaining = 90 - (energy_log.used_capacity if energy_log else 0)
    
    llm = create_reasoning_llm()
    
    prompt = REASONING_PROMPT.format(
        date=str(today),
        pending_count=pending_count,
        energy_remaining=energy_remaining
    )
    
    messages = [
        SystemMessage(content=prompt),
        HumanMessage(content=user_input)
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content
        
        # Try to parse and create tasks if plan exists
        try:
            data = json.loads(content)
            if "plan" in data and data["plan"]:
                # Create suggested tasks
                for task_data in data["plan"][:5]:  # Limit to 5
                    new_task = models.Task(
                        title=task_data.get("title", "Untitled"),
                        priority=task_data.get("priority", "Medium"),
                        energy_cost=task_data.get("energy", 3.0),
                        status="todo",
                        user_id=DEFAULT_USER_ID
                    )
                    db.add(new_task)
                db.commit()
                
                result = data.get("response", content) + f"\n\n✅ Created {len(data['plan'])} tasks from your plan."
            else:
                result = data.get("response", content)
        except json.JSONDecodeError:
            result = content
            
    except Exception as e:
        result = f"Error in reasoning: {str(e)}"
    
    return {
        "messages": [AIMessage(content=result)],
        "final_response": result
    }


# ===== DOCUMENT NODE (qwen2.5) =====

DOCUMENT_PROMPT = """You are a document analysis AI.

Your job:
1. Read and understand the document content
2. Extract key points
3. Suggest actionable tasks

Document content:
{content}

OUTPUT FORMAT:
{{
  "summary": "brief summary of the document",
  "key_points": ["point 1", "point 2", "point 3"],
  "suggested_tasks": [
    {{"title": "task from document", "priority": "Medium"}}
  ],
  "response": "human-readable summary for user"
}}

Be thorough but concise."""


def create_document_llm():
    """Create qwen2.5 for document reading."""
    base_url = os.getenv("AI_MODEL_URL", "http://localhost:11434")
    if "/v1" in base_url:
        base_url = base_url.split("/v1")[0]
    
    return ChatOllama(
        model="qwen2.5:14b",  # Using the installed 14b version
        base_url=base_url,
        temperature=0.3
    )


def document_node(state: AgentState, db: Session) -> dict:
    """
    Handle document reading and summarization.
    Uses qwen2.5.
    """
    user_input = state.get("user_input", "")
    route = state.get("route")
    
    # Get document content
    doc_id = route.doc_id if route else None
    doc_content = ""
    doc_title = ""
    
    if doc_id:
        try:
            from uuid import UUID
            doc = db.query(models.Document).filter(
                models.Document.id == UUID(doc_id)
            ).first()
            if doc:
                doc_content = doc.content or ""
                doc_title = doc.title
        except:
            pass
    
    if not doc_content:
        # Try to get most recent document
        docs = db.query(models.Document).order_by(
            models.Document.last_edited.desc()
        ).limit(3).all()
        
        if docs:
            doc_list = "\n".join([f"• {d.title} (ID: {d.id})" for d in docs])
            return {
                "messages": [AIMessage(content=f"Which document would you like me to read?\n\n{doc_list}")],
                "final_response": f"Which document would you like me to read?\n\n{doc_list}"
            }
        else:
            return {
                "messages": [AIMessage(content="No documents found in your Brain.")],
                "final_response": "No documents found in your Brain."
            }
    
    # Chunk if too long (simple chunking)
    max_chars = 3000
    if len(doc_content) > max_chars:
        doc_content = doc_content[:max_chars] + "...(truncated)"
    
    llm = create_document_llm()
    
    prompt = DOCUMENT_PROMPT.format(content=doc_content)
    
    messages = [
        SystemMessage(content=prompt),
        HumanMessage(content=f"Analyze this document: {doc_title}\n\nUser request: {user_input}")
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content
        
        # Try to create suggested tasks
        try:
            data = json.loads(content)
            if "suggested_tasks" in data and data["suggested_tasks"]:
                for task_data in data["suggested_tasks"][:3]:
                    new_task = models.Task(
                        title=task_data.get("title", "Untitled"),
                        priority=task_data.get("priority", "Medium"),
                        energy_cost=3.0,
                        status="todo",
                        user_id=DEFAULT_USER_ID,
                        context=f"From document: {doc_title}"
                    )
                    db.add(new_task)
                db.commit()
                
                result = data.get("response", content) + f"\n\n✅ Created {len(data['suggested_tasks'])} tasks from document."
            else:
                result = data.get("response", content)
        except json.JSONDecodeError:
            result = content
            
    except Exception as e:
        result = f"Error reading document: {str(e)}"
    
    return {
        "messages": [AIMessage(content=result)],
        "final_response": result
    }


# ===== SMALLTALK NODE =====

def smalltalk_node(state: AgentState, db: Session) -> dict:
    """Handle casual conversation."""
    user_input = state.get("user_input", "").lower()
    
    if any(word in user_input for word in ["hello", "hi", "hey"]):
        response = "Hello! I'm P.I.S., your Personal Intelligence Scheduler. How can I help you manage your tasks today?"
    elif any(word in user_input for word in ["thank", "thanks"]):
        response = "You're welcome! Let me know if you need anything else."
    elif any(word in user_input for word in ["who are you", "what are you"]):
        response = "I'm P.I.S. (Personal Intelligence Scheduler), an AI assistant that helps you manage tasks, plan your schedule, and read documents. What would you like to do?"
    elif any(word in user_input for word in ["help", "what can you do"]):
        response = """I can help you with:
• **Tasks**: Create, list, complete, or delete tasks
• **Planning**: Schedule your day/week, prioritize tasks
• **Documents**: Read and summarize your Brain documents

Just tell me what you need!"""
    else:
        response = "I'm here to help you manage your tasks and schedule. What would you like to do?"
    
    return {
        "messages": [AIMessage(content=response)],
        "final_response": response
    }
