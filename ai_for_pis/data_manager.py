import json
import os
from typing import List, Dict, Any

TASKS_FILE = "tasks.json"
CALENDAR_FILE = "calendar.json"

def _load_json_file(filename: str) -> List[Dict[str, Any]]:
    if not os.path.exists(filename):
        return []
    try:
        with open(filename, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def _save_json_file(filename: str, data: List[Dict[str, Any]]):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)

def load_tasks() -> List[Dict[str, Any]]:
    return _load_json_file(TASKS_FILE)

def save_tasks(tasks: List[Dict[str, Any]]):
    _save_json_file(TASKS_FILE, tasks)

def load_calendar() -> List[Dict[str, Any]]:
    return _load_json_file(CALENDAR_FILE)

def save_calendar(events: List[Dict[str, Any]]):
    _save_json_file(CALENDAR_FILE, events)

def add_task_to_db(description: str, priority: str, project: str = "General") -> Dict[str, Any]:
    tasks = load_tasks()
    new_task = {
        "id": str(len(tasks) + 1),
        "description": description,
        "priority": priority,
        "status": "Pending",
        "project": project
    }
    tasks.append(new_task)
    save_tasks(tasks)
    return new_task

def add_calendar_event_to_db(description: str, date: str, time: str) -> Dict[str, Any]:
    events = load_calendar()
    new_event = {
        "id": str(len(events) + 1),
        "description": description,
        "date": date,
        "time": time
    }
    events.append(new_event)
    save_calendar(events)
    return new_event

def update_task_status_in_db(task_id: str, status: str) -> Dict[str, Any]:
    tasks = load_tasks()
    for task in tasks:
        if task["id"] == task_id or task["description"].lower() == task_id.lower(): # Allow matching by description loosely
             task["status"] = status
             save_tasks(tasks)
             return task
    return None

def get_project_stats(project_name: str) -> Dict[str, int]:
    tasks = load_tasks()
    stats = {"Pending": 0, "In Progress": 0, "Done": 0}
    
    # Normalize project name search
    project_lower = project_name.lower()
    
    for task in tasks:
        # Check if project matches or if task belongs to project 
        # (Assuming 'project' field exists, if not strictly enforced, we might check description tags)
        if task.get("project", "").lower() == project_lower:
             status = task.get("status", "Pending")
             if status in stats:
                 stats[status] += 1
             else:
                 # Normalize status case if needed, or just add to distinct keys
                 if status not in stats: stats[status] = 0
                 stats[status] += 1
    return stats
