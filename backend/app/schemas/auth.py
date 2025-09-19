from pydantic import BaseModel, EmailStr, constr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_in: int

class UserLogin(BaseModel):
    email: EmailStr
    password: str