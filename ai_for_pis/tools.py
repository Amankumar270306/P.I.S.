from langchain_core.tools import tool
from typing import Optional
from data_manager import add_task_to_db, add_calendar_event_to_db, update_task_status_in_db, get_project_stats

@tool
def add_task(description: str, priority: str, project: str = "General"):
    """Adds a generic task to the project management system.
    
    Args:
        description: The description of the task.
        priority: The priority of the task (e.g., High, Medium, Low).
        project: The project name this task belongs to. Defaults to "General".
    """
    task = add_task_to_db(description, priority, project)
    return f"Task added: {task['description']} (ID: {task['id']}) to project '{task['project']}'"

@tool
def add_calendar_task(description: str, date: str, time: str):
    """Adds a task with a specific date and time to the calendar.
    
    Args:
        description: The description of the calendar event.
        date: The date of the event (YYYY-MM-DD).
        time: The time of the event (HH:MM).
    """
    event = add_calendar_event_to_db(description, date, time)
    return f"Calendar event added: {event['description']} on {event['date']} at {event['time']}"

@tool
def read_project_status(project_name: str):
    """Reads the status of a specific project, returning counts of tasks in each state.
    
    Args:
        project_name: The name of the project to check.
    """
    stats = get_project_stats(project_name)
    return f"Status for project '{project_name}':\n- Pending: {stats['Pending']}\n- In Progress: {stats['In Progress']}\n- Done: {stats['Done']}"

@tool
def update_task_status(task_id: str, new_status: str):
    """Updates the progress/status of a specific task.
    
    Args:
        task_id: The ID or exact description of the task to update.
        new_status: The new status (e.g., 'Pending', 'In Progress', 'Done').
    """
    updated_task = update_task_status_in_db(task_id, new_status)
    if updated_task:
        return f"Task '{updated_task['description']}' updated to status: {updated_task['status']}"
    else:
        return f"Task with ID or description '{task_id}' not found."
