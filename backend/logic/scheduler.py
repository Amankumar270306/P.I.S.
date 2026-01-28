from datetime import date, datetime, timedelta
import models

def optimize_schedule(tasks, daily_limit=40, current_load=0):
    """
    Heuristic-based scheduling algorithm.
    Returns (scheduled_tasks, backlog_tasks)
    """
    
    # 1. Sort Tasks
    def sort_key(task):
        # A. Deadline Criticality (0 if overdue/today, 1 if tomorrow, 2 otherwise)
        deadline_score = 2
        if task.deadline:
            # Simple check, assumes datetime or date objects
            d = task.deadline.date() if isinstance(task.deadline, datetime) else task.deadline
            today = date.today()
            
            if d < today: deadline_score = 0   # Overdue
            elif d == today: deadline_score = 0 # Due Today
            elif d == today + timedelta(days=1): deadline_score = 1 # Tomorrow
        
        # B. Priority Score (0=High, 1=Medium, 2=Low)
        priority_map = {"High": 0, "Medium": 1, "Low": 2}
        priority_score = priority_map.get(task.priority, 1)
        
        # C. Energy Efficiency (Favor Higher cost first to fill big rocks? Or Lower for quick wins?)
        # Let's do Big Rocks First (Higher energy first). Negate to sort ascending.
        energy_score = -task.energy_cost
        
        return (deadline_score, priority_score, energy_score)

    sorted_tasks = sorted(tasks, key=sort_key)
    
    # 2. Knapsack Fill
    scheduled = []
    backlog = []
    remaining_energy = daily_limit - current_load
    
    for task in sorted_tasks:
        if task.energy_cost <= remaining_energy:
            scheduled.append(task)
            remaining_energy -= task.energy_cost
        else:
            backlog.append(task)
            
    return scheduled, backlog
