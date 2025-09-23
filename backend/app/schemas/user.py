from typing import Literal, Optional


from app.schemas.validators import FullNameStr, PasswordStr
from pydantic import BaseModel, ConfigDict, EmailStr, model_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: PasswordStr
    full_name: FullNameStr
    role: Literal["ADMIN", "MEMBER"] = "MEMBER"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str


class User(UserBase):
    model_config = ConfigDict(from_attributes=True)

    role: str  # ADMIN | MEMBER ...


class UserPublic(BaseModel):
    role: str


class UserDeleteIn(BaseModel):
    email: EmailStr
    full_name: FullNameStr
    role: Literal["ADMIN", "MEMBER"]


class PasswordChangeIn(BaseModel):
    old_password: str
    new_password: PasswordStr
    confirm: Optional[str] = None

    @model_validator(mode="after")
    def _confirm_matches(self):
        if self.confirm is not None and self.new_password != self.confirm:
            raise ValueError("La confirmation du mot de passe ne correspond pas")
        return self
