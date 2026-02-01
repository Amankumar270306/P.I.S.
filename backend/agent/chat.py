"""
AI Chat Agent with Tool Calling for P.I.S.
Supports task management, document reading, and linked task creation.
"""

import os
import json
from sqlalchemy.orm import Session
from datetime import date
import requests

import models
from agent.tools import TOOL_DEFINITIONS, execute_tool


def get_system_context(db: Session, daily_limit=30):
    """
    Gather real-time state of the user's life.
    """
    # Get energy status
    today = date.today()
    energy_log = db.query(models.EnergyLog).filter(models.EnergyLog.date == today).first()
    
    if energy_log:
        remaining = energy_log.capacity - energy_log.used
        used = energy_log.used
    else:
        remaining = daily_limit
        used = 0
    
    # Get today's tasks
    today_tasks = db.query(models.Task).filter(
        models.Task.scheduled_date == today,
        models.Task.status != "done"
    ).order_by(models.Task.priority, models.Task.energy_cost.desc()).limit(5).all()
    
    task_str = ", ".join([f"{t.title} ({t.priority}, {t.energy_cost}pts)" for t in today_tasks])
    if not task_str:
        task_str = "No tasks scheduled for today"
    
    # Get pending tasks count
    pending_count = db.query(models.Task).filter(models.Task.status == "todo").count()
    
    # Get document count
    doc_count = db.query(models.Document).count()
    
    return {
        "energy_remaining": remaining,
        "energy_used": used,
        "today_tasks": task_str,
        "pending_tasks_count": pending_count,
        "documents_count": doc_count,
        "date": str(today)
    }


SYSTEM_PROMPT = """You are P.I.S. (Personal Intelligence Scheduler), an executive AI assistant.

Your capabilities:
- Create, update, delete, and list tasks
- Read documents from the Brain
- Create linked tasks from document context
- Check energy status

Current user context:
- Date: {date}
- Energy: {energy_used}/{energy_total} used ({energy_remaining} remaining)
- Today's tasks: {today_tasks}
- Total pending tasks: {pending_tasks_count}
- Brain documents: {documents_count}

Guidelines:
1. Be concise and efficient
2. When creating tasks, always confirm the action completed
3. When user asks to see tasks/documents, use the appropriate tool
4. For task creation from documents, first read the document, then create linked tasks
5. Use energy cost wisely - high-energy tasks cost 7-10, medium 4-6, low 1-3
6. Set importance=true for Eisenhower "important" tasks
7. Set is_urgent=true for time-sensitive tasks

You have access to tools to manage the user's system. Use them when appropriate."""


def call_ai_with_tools(messages: list, tools: list = None):
    """Make a request to the AI with function calling support."""
    url = os.getenv("AI_MODEL_URL", "http://localhost:11434/v1/chat/completions")
    api_key = os.getenv("AI_API_KEY", "")
    model = os.getenv("AI_MODEL_NAME", "llama3.1:8b")
    
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7
    }
    
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        return {"error": "AI brain is offline. Please start Ollama with: ollama run llama3.1:8b"}
    except Exception as e:
        return {"error": str(e)}


def chat_with_agent(user_message: str, db: Session) -> str:
    """
    Main chat function that handles tool calling.
    """
    try:
        # Get context
        context = get_system_context(db)
        
        # Build system prompt
        system_prompt = SYSTEM_PROMPT.format(
            date=context["date"],
            energy_used=context["energy_used"],
            energy_total=30,
            energy_remaining=context["energy_remaining"],
            today_tasks=context["today_tasks"],
            pending_tasks_count=context["pending_tasks_count"],
            documents_count=context["documents_count"]
        )
        
        # Initial messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        # First AI call with tools
        response = call_ai_with_tools(messages, TOOL_DEFINITIONS)
        
        if "error" in response:
            return response["error"]
        
        # Extract response
        choice = response.get("choices", [{}])[0]
        message = choice.get("message", {})
        
        # Check for tool calls
        tool_calls = message.get("tool_calls", [])
        
        if tool_calls:
            # Execute each tool and gather results
            tool_results = []
            
            for tool_call in tool_calls:
                func = tool_call.get("function", {})
                tool_name = func.get("name", "")
                
                try:
                    arguments = json.loads(func.get("arguments", "{}"))
                except:
                    arguments = {}
                
                # Execute the tool
                result = execute_tool(db, tool_name, arguments)
                tool_results.append({
                    "tool_call_id": tool_call.get("id", ""),
                    "role": "tool",
                    "name": tool_name,
                    "content": json.dumps(result)
                })
            
            # Add assistant message with tool calls
            messages.append(message)
            
            # Add tool results
            messages.extend(tool_results)
            
            # Second AI call to generate final response
            final_response = call_ai_with_tools(messages)
            
            if "error" in final_response:
                # Return tool results directly if AI fails
                return f"Action completed: {json.dumps(tool_results[0]['content'])}"
            
            final_message = final_response.get("choices", [{}])[0].get("message", {})
            return final_message.get("content", "Action completed successfully.")
        
        else:
            # No tool calls, just return the response
            return message.get("content", "I'm not sure how to help with that.")
    
    except Exception as e:
        return f"Error processing request: {str(e)}"


def simple_chat(user_message: str, db: Session) -> str:
    """
    Fallback simple chat without function calling (for models that don't support it).
    """
    try:
        context = get_system_context(db)
        
        system_prompt = f"""You are P.I.S., an executive AI assistant.
User's energy: {context['energy_used']}/30 used ({context['energy_remaining']} remaining)
Today's tasks: {context['today_tasks']}
Pending tasks: {context['pending_tasks_count']}
Documents: {context['documents_count']}

Be concise. Help the user manage their time and tasks."""
        
        url = os.getenv("AI_MODEL_URL", "http://localhost:11434/v1/chat/completions")
        model = os.getenv("AI_MODEL_NAME", "llama3.1:8b")
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.7
        }
        
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
        
    except Exception as e:
        return f"Error: {str(e)}"
