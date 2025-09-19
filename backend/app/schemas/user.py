from uuid import UUID
from pydantic import BaseModel, EmailStr, constr, ConfigDict, field_validator
from typing import Optional

PasswordStr = constr(min_length=8)

class UserCreate(BaseModel):
    email: EmailStr
    password: PasswordStr
    full_name: constr(min_length=1)
    role: Optional[str] = "MEMBER"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str

class User(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    role: str  # ADMIN | MEMBER ...

class UserPublic(BaseModel):
    role: str