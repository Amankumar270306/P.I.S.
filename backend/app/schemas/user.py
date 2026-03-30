from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, date
from uuid import UUID

class UserProfileBase(BaseModel):
    profession: Optional[str] = Field(None, description="User's profession")
    birth_date: Optional[date] = Field(None, description="User's birth date")

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    first_name: str = Field(..., description="User's first name")
    last_name: str = Field("", description="User's last name")
    email: str = Field(..., description="User's email address")
    phone: Optional[str] = Field(None, description="User's phone number")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="User's password")
    profile: Optional[UserProfileBase] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile: Optional[UserProfileBase] = None

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    profile: Optional[UserProfileBase] = None

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: str
    password: str

class UserLoginResponse(BaseModel):
    user: UserResponse
    message: str
