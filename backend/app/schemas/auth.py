"""Pydantic schemas exposed by the API.

Conventions:
- Precise types (Optional, List, Dict, etc.)
"""

from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_in: int


class UserLogin(BaseModel):
    email: EmailStr
    password: str
