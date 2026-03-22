from fastapi import APIRouter, Depends, Query
from uuid import UUID
from typing import List, Optional
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate, TaskListCreate, TaskListResponse
from app.services.task_service import TaskService
from app.api.deps import get_task_service, require_auth

tasks_router = APIRouter()
lists_router = APIRouter()

# --- Tasks ---
@tasks_router.post("/", response_model=TaskResponse, summary="Create a new task")
def create_task(task: TaskCreate, service: TaskService = Depends(get_task_service), user_id: UUID = Depends(require_auth)):
    return service.create_task(user_id, task)

@tasks_router.get("/", response_model=List[TaskResponse], summary="List all tasks")
def read_tasks(
    status: Optional[str] = Query(None),
    min_energy: Optional[float] = Query(None),
    list_id: Optional[UUID] = Query(None),
    service: TaskService = Depends(get_task_service),
    user_id: UUID = Depends(require_auth)
):
    return service.get_tasks(user_id, status, min_energy, list_id)

@tasks_router.delete("/{task_id}", summary="Delete a task")
def delete_task(task_id: UUID, service: TaskService = Depends(get_task_service), user_id: UUID = Depends(require_auth)):
    service.delete_task(task_id)
    return {"message": "Task deleted"}

@tasks_router.patch("/{task_id}", response_model=TaskResponse, summary="Update a task")
def update_task(task_id: UUID, task_update: TaskUpdate, service: TaskService = Depends(get_task_service), user_id: UUID = Depends(require_auth)):
    return service.update_task(task_id, task_update)

# --- Lists ---
@lists_router.get("/", response_model=List[TaskListResponse], summary="List all task lists")
def read_lists(service: TaskService = Depends(get_task_service), user_id: UUID = Depends(require_auth)):
    return service.get_lists(user_id)

@lists_router.post("/", response_model=TaskListResponse, summary="Create a new task list")
def create_list(task_list: TaskListCreate, service: TaskService = Depends(get_task_service), user_id: UUID = Depends(require_auth)):
    return service.create_list(user_id, task_list)

@lists_router.delete("/{list_id}", summary="Delete a task list")
def delete_list(list_id: UUID, service: TaskService = Depends(get_task_service), user_id: UUID = Depends(require_auth)):
    service.delete_list(list_id)
    return {"message": "List deleted"}
