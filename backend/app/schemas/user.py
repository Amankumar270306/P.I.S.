from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    first_name: str = Field(..., description="User's first name")
    last_name: str = Field("", description="User's last name")
    email: str = Field(..., description="User's email address")
    phone: Optional[str] = Field(None, description="User's phone number")
    age: Optional[int] = Field(None, description="User's age")
    profession: Optional[str] = Field(None, description="User's profession")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="User's password")

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    profession: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: str
    password: str

class UserLoginResponse(BaseModel):
    user: UserResponse
    message: str
