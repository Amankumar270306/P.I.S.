"""
Task tool — creates tasks via the internal P.I.S. Tasks API.
"""
import requests

TASKS_API_BASE = "http://localhost:8000"


def execute_create_task(args: dict, user_id: str) -> dict:
    """Call POST /tasks/ on the internal API to create a task."""
    payload = {
        "title": args.get("title", "Untitled Task"),
        "importance": args.get("importance", False),
        "is_urgent": args.get("is_urgent", False),
        "priority_id": args.get("priority_id", 2),
        "status_id": 1,
    }

    if args.get("description"):
        payload["description"] = args["description"]

    # Build schedule object
    schedule = {}
    if args.get("deadline"):
        schedule["deadline"] = args["deadline"]
    if args.get("scheduled_date"):
        schedule["scheduled_date"] = args["scheduled_date"]
    if schedule:
        payload["schedule"] = schedule

    # Build execution object
    execution = {}
    if args.get("energy_cost"):
        execution["energy_cost"] = args["energy_cost"]
    if args.get("started_at"):
        execution["started_at"] = args["started_at"]
    if args.get("ended_at"):
        execution["ended_at"] = args["ended_at"]
    if execution:
        payload["execution"] = execution

    try:
        resp = requests.post(
            f"{TASKS_API_BASE}/tasks/",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-User-Id": user_id,
            },
            timeout=10,
        )
        if resp.status_code in (200, 201):
            task_data = resp.json()
            return {
                "success": True,
                "task_id": task_data.get("id"),
                "title": task_data.get("title"),
                "message": f"Task '{task_data.get('title')}' created successfully!",
            }
        else:
            return {
                "success": False,
                "error": f"API returned {resp.status_code}: {resp.text}",
            }
    except Exception as e:
        return {"success": False, "error": str(e)}
