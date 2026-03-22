from fastapi import APIRouter, Depends
from uuid import UUID
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService
from app.api.deps import get_user_service, require_auth

router = APIRouter()

@router.get("/{user_id}", response_model=UserResponse, summary="Get user by ID")
def get_user(user_id: UUID, service: UserService = Depends(get_user_service)):
    return service.get_profile(user_id)

@router.patch("/{user_id}", response_model=UserResponse, summary="Update user profile")
def update_user(user_id: UUID, user_update: UserUpdate, service: UserService = Depends(get_user_service), current_user: UUID = Depends(require_auth)):
    return service.update_profile(user_id, user_update)
