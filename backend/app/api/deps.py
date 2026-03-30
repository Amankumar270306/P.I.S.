from fastapi import Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
import uuid
from typing import Optional

from app.repositories.user_repo import UserRepository
from app.repositories.task_repo import TaskRepository
from app.repositories.energy_repo import EnergyRepository
from app.repositories.document_repo import DocumentRepository

from app.services.user_service import UserService
from app.services.task_service import TaskService
from app.services.energy_service import EnergyService
from app.services.document_service import DocumentService

def get_current_user_id(request: Request) -> Optional[uuid.UUID]:
    user_id_header = request.headers.get("X-User-Id")
    if user_id_header:
        try:
            return uuid.UUID(user_id_header)
        except ValueError:
            pass
    return None

def require_auth(user_id: Optional[uuid.UUID] = Depends(get_current_user_id)) -> uuid.UUID:
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated. Please login first.")
    return user_id

def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))

def get_task_service(db: Session = Depends(get_db)) -> TaskService:
    return TaskService(TaskRepository(db), EnergyRepository(db))

def get_energy_service(db: Session = Depends(get_db)) -> EnergyService:
    return EnergyService(EnergyRepository(db), TaskRepository(db))

def get_document_service(db: Session = Depends(get_db)) -> DocumentService:
    return DocumentService(DocumentRepository(db))

from app.ai.chat_service import ChatService

def get_chat_service() -> ChatService:
    return ChatService()
