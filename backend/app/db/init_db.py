import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database import engine, SessionLocal
import models
import uuid

def migrate():
    print("Starting migration...")
    
    with engine.connect() as conn:
        try:
            # For SQLite
            if engine.dialect.name == "sqlite":
                conn.execute(text("ALTER TABLE task_lists ADD COLUMN is_permanent BOOLEAN DEFAULT 0;"))
            # For PostgreSQL
            else:
                conn.execute(text("ALTER TABLE task_lists ADD COLUMN is_permanent BOOLEAN DEFAULT FALSE;"))
            conn.commit()
            print("Successfully added is_permanent column.")
        except Exception as e:
            print(f"Column might already exist or error occurred: {e}")

    # Seed the permanent task list
    db = SessionLocal()
    try:
        permanent_list = db.query(models.TaskList).filter(
            models.TaskList.name == "Permanent Tasks", 
            models.TaskList.is_permanent == True
        ).first()
        if not permanent_list:
            print("Creating default 'Permanent Tasks' list...")
            new_list = models.TaskList(
                id=uuid.uuid4(),
                user_id=None,
                name="Permanent Tasks",
                color="#ef4444", 
                icon="lock",
                is_permanent=True
            )
            db.add(new_list)
            db.commit()
            print("Done seeding.")
        else:
            print("Permanent list already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
