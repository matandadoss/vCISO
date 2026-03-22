from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "Viewer"
    is_active: bool = True

class UserCreate(UserBase):
    pass

class UserInvite(BaseModel):
    email: EmailStr
    role: str = "Viewer"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: uuid.UUID
    org_id: uuid.UUID
    firebase_uid: str
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True
