import os
from sqlalchemy.orm import Session
from datetime import date
import agent.client as ai_client

import models

def get_system_context(db: Session, daily_limit=40):
    """
    Gather real-time state of the user's life.
    """
    # 1. Energy
    # Mock calculation for now or sum of today's done tasks
    current_load = 5 # Mock: User has used 5 points
    remaining = daily_limit - current_load
    
    # 2. Top Tasks (Scheduled for Today)
    today = date.today()
    top_tasks = db.query(models.Task).filter(
        models.Task.scheduled_date == today,
        models.Task.status != "done"
    ).order_by(models.Task.priority, models.Task.energy_cost.desc()).limit(3).all()
    
    task_str = ", ".join([f"{t.title} ({t.priority}, {t.energy_cost}pts)" for t in top_tasks])
    if not task_str:
        task_str = "None. You are free!"
        
    return f"User has {remaining} energy left today. Top priority tasks are: {task_str}."

def chat_with_agent(user_message: str, db: Session):
    try:
        context = get_system_context(db)
        
        system_prompt = f"""
        You are PIS, an executive assistant. 
        User Energy: {context} 
        Be concise and ruthless.
        """
        
        response = ai_client.query_custom_ai(system_prompt, user_message)
        return response
        
    except Exception as e:
        return f"I'm having trouble thinking right now. ({str(e)})"
