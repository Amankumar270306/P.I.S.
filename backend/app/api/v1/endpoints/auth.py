from fastapi import APIRouter, Depends
from uuid import UUID
from app.schemas.user import UserCreate, UserResponse, UserLogin, UserLoginResponse
from app.services.user_service import UserService
from app.api.deps import get_user_service, require_auth

router = APIRouter()

@router.post("/register", response_model=UserResponse, summary="Register a new user")
def register_user(user: UserCreate, service: UserService = Depends(get_user_service)):
    return service.register(user)

@router.post("/login", response_model=UserLoginResponse, summary="Login user")
def login_user(credentials: UserLogin, service: UserService = Depends(get_user_service)):
    return service.login(credentials)

@router.get("/me", response_model=UserResponse, summary="Get current user profile")
def get_current_user(user_id: UUID = Depends(require_auth), service: UserService = Depends(get_user_service)):
    return service.get_profile(user_id)
