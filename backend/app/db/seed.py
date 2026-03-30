"""
Seed the database with the 5 permanent (system) task lists.
These are virtual/smart lists that appear for every user.
They are created once on app startup if they don't already exist.
"""
from sqlalchemy.orm import Session
from app.models.task import TaskList


PERMANENT_LISTS = [
    {"name": "Today",     "icon": "sun",           "color": "#f59e0b", "is_permanent": True},
    {"name": "Scheduled", "icon": "calendar",      "color": "#3b82f6", "is_permanent": True},
    {"name": "All",       "icon": "layers",        "color": "#8b5cf6", "is_permanent": True},
    {"name": "Important", "icon": "star",           "color": "#ef4444", "is_permanent": True},
    {"name": "Completed", "icon": "check-circle",   "color": "#10b981", "is_permanent": True},
]


def seed_permanent_lists(db: Session) -> None:
    """Create the 5 permanent task lists if they don't already exist."""
    existing = (
        db.query(TaskList)
        .filter(TaskList.is_permanent == True, TaskList.user_id == None)  # noqa: E711
        .all()
    )
    existing_names = {tl.name for tl in existing}

    created = 0
    for entry in PERMANENT_LISTS:
        if entry["name"] not in existing_names:
            db.add(TaskList(**entry, user_id=None))
            created += 1

    if created:
        db.commit()
        print(f"[seed] Created {created} permanent task list(s).")
    else:
        print("[seed] All permanent task lists already exist — nothing to do.")
