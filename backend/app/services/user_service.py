from fastapi import HTTPException
from uuid import UUID
from typing import Optional
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserLogin
from app.core.security import hash_password, verify_password

class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    def register(self, user_in: UserCreate):
        if self.repo.get_by_email(user_in.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        if user_in.phone and self.repo.get_by_phone(user_in.phone):
            raise HTTPException(status_code=400, detail="Phone number already registered")
        
        user_data = user_in.model_dump()
        user_data["password"] = hash_password(user_data["password"])
        
        return self.repo.create(user_data)

    def login(self, creds: UserLogin):
        user = self.repo.get_by_email(creds.email)
        if not user or not verify_password(creds.password, user.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        return {"user": user, "message": "Login successful"}

    def get_profile(self, user_id: UUID):
        user = self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def update_profile(self, user_id: UUID, user_update: UserUpdate):
        user = self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        update_data = user_update.model_dump(exclude_unset=True)
        return self.repo.update(user, update_data)
