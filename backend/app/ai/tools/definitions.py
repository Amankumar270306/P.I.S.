"""
OpenAI function-calling tool definitions for Plori AI.
Add new tools here and register them in the TOOLS list.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Creates a new task in the user's P.I.S. task manager. Call this when the user wants to add a task and you have gathered enough information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The title/name of the task"
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional detailed description or notes for the task"
                    },
                    "deadline": {
                        "type": "string",
                        "description": "Optional deadline in ISO 8601 format (e.g. '2026-03-30T17:00:00Z')"
                    },
                    "scheduled_date": {
                        "type": "string",
                        "description": "Optional scheduled date in ISO 8601 format"
                    },
                    "started_at": {
                        "type": "string",
                        "description": "Optional start time in ISO 8601 format for calendar scheduling"
                    },
                    "ended_at": {
                        "type": "string",
                        "description": "Optional end time in ISO 8601 format for calendar scheduling"
                    },
                    "importance": {
                        "type": "boolean",
                        "description": "Whether the task is important (Eisenhower matrix). Default false."
                    },
                    "is_urgent": {
                        "type": "boolean",
                        "description": "Whether the task is urgent (Eisenhower matrix). Default false."
                    },
                    "energy_cost": {
                        "type": "integer",
                        "description": "Energy cost from 1-10 (each point ~10 min of work). Default 3."
                    },
                    "priority_id": {
                        "type": "integer",
                        "description": "Priority: 1=Low, 2=Medium, 3=High. Default 2."
                    }
                },
                "required": ["title"]
            }
        }
    }
]
