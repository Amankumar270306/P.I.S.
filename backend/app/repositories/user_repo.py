from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, Optional
from app.models.user import User, UserProfile

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_phone(self, phone: str) -> Optional[User]:
        return self.db.query(User).filter(User.phone == phone).first()

    def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, user_data: Dict[str, Any]) -> User:
        profile_data = user_data.pop("profile", None)
        db_user = User(**user_data)
        if profile_data:
            db_user.profile = UserProfile(**profile_data)
            
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update(self, user: User, update_data: Dict[str, Any]) -> User:
        profile_data = update_data.pop("profile", None)
        
        for key, value in update_data.items():
            setattr(user, key, value)
            
        if profile_data is not None:
            if user.profile:
                for key, value in profile_data.items():
                    setattr(user.profile, key, value)
            else:
                user.profile = UserProfile(**profile_data)
                
        self.db.commit()
        self.db.refresh(user)
        return user
