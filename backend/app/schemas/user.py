"""Pydantic schemas exposed by the API.

Conventions:
- Precise types (Optional, List, Dict, etc.)
"""

from typing import Literal, Optional


from app.config.roles import Role
from app.schemas.validators import NameFirstStr, NameLastStr, PasswordStr
from pydantic import BaseModel, ConfigDict, EmailStr, model_validator


class UserCreate(BaseModel):
    """User registration/creation payload (API input)."""

    email: EmailStr
    password: PasswordStr
    first_name: NameFirstStr
    last_name: NameLastStr
    role: Role = Role.MEMBER


class UserBase(BaseModel):
    """Common user data (basis for other schemas)."""

    email: EmailStr
    first_name: str
    last_name: str
    role: str


class User(UserBase):
    """Representation of a read-side user (from the DB model)."""

    model_config = ConfigDict(from_attributes=True)
    first_name: str
    last_name: str
    role: Role  # ADMIN | MEMBER ...


class UserPublic(BaseModel):
    """Minimum public view of a user (restricted exposure for frontend)."""

    first_name: str
    last_name: str
    role: Role


class UserDeleteIn(BaseModel):
    """Payload to request the deletion of a user (API entry)."""

    email: EmailStr
    first_name: NameFirstStr
    last_name: NameLastStr
    role: Literal["ADMIN", "MEMBER"]


class PasswordChangeIn(BaseModel):
    """Password change payload (API input)."""

    old_password: str
    new_password: PasswordStr
    confirm: Optional[str] = None

    @model_validator(mode="after")
    def _confirm_matches(self):
        # Valide que `confirm` correspond à `new_password` si `confirm` est fourni.
        if self.confirm is not None and self.new_password != self.confirm:
            raise ValueError("La confirmation du mot de passe ne correspond pas")
        return self
