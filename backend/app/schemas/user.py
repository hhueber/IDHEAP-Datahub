"""Pydantic schemas exposed by the API.

Conventions:
- Precise types (Optional, List, Dict, etc.)
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, model_validator

from app.config.roles import PermissionRole
from app.schemas.validators import NameFirstStr, NameLastStr, PasswordStr


class UserCreate(BaseModel):
    """User registration/creation payload (API input)."""

    email: EmailStr
    password: PasswordStr
    first_name: NameFirstStr
    last_name: NameLastStr
    role: PermissionRole = PermissionRole.DATASET_VIEWER


class UserBase(BaseModel):
    """Common user data (basis for other schemas)."""

    email: EmailStr
    first_name: str
    last_name: str
    role: PermissionRole


class User(UserBase):
    """Representation of a read-side user (from the DB model)."""

    model_config = ConfigDict(from_attributes=True)
    id: str
    first_name: str
    last_name: str
    role: PermissionRole


class UserPublic(BaseModel):
    """Minimum public view of a user (restricted exposure for frontend)."""

    model_config = ConfigDict(from_attributes=True)

    first_name: str
    last_name: str
    role: PermissionRole


class UserDeleteIn(BaseModel):
    """Payload to request the deletion of a user (API entry)."""

    email: EmailStr
    first_name: NameFirstStr
    last_name: NameLastStr
    role: PermissionRole


class PasswordChangeIn(BaseModel):
    """Password change payload (API input)."""

    old_password: str
    new_password: PasswordStr
    confirm: str | None = None

    @model_validator(mode="after")
    def _confirm_matches(self):
        # Valide que `confirm` correspond à `new_password` si `confirm` est fourni.
        if self.confirm is not None and self.new_password != self.confirm:
            raise ValueError("La confirmation du mot de passe ne correspond pas")
        return self


class AdminUserItem(BaseModel):
    """Ligne affichée dans la page admin des utilisateurs."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: PermissionRole
    created_at: datetime | None = None


class AdminUserListPayload(BaseModel):
    items: list[AdminUserItem]
    total: int
    page: int
    per_page: int
    pages: int


class AdminUserListResponse(BaseModel):
    success: bool
    detail: str
    data: AdminUserListPayload


class AdminUserUpdateIn(BaseModel):
    """Payload de modification inline côté admin."""

    first_name: NameFirstStr | None = None
    last_name: NameLastStr | None = None
    email: EmailStr | None = None
    role: PermissionRole | None = None


class AdminUserActionResponse(BaseModel):
    success: bool
    detail: str
