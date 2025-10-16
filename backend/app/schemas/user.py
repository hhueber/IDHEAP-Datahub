from typing import Literal, Optional


from app.schemas.validators import FullNameStr, PasswordStr
from pydantic import BaseModel, ConfigDict, EmailStr, model_validator


# pour les entrée API on garantie que les data on le format demander


class UserCreate(BaseModel):
    """Payload d'inscription/creation d'utilisateur (entrée API)."""

    email: EmailStr
    password: PasswordStr
    full_name: FullNameStr
    role: Literal["ADMIN", "MEMBER"] = "MEMBER"


class UserBase(BaseModel):
    """Données communes d'un utilisateur (base pour d'autres schémas)."""

    email: EmailStr
    full_name: str
    role: str


class User(UserBase):
    """Représentation d'un utilisateur côté lecture (depuis le modèle DB)."""

    model_config = ConfigDict(from_attributes=True)

    role: str  # ADMIN | MEMBER ...


class UserPublic(BaseModel):
    """Vue publique minimale d'un utilisateur (exposition restreinte pour frontend)."""

    role: str


class UserDeleteIn(BaseModel):
    """Payload pour demander la suppression d'un utilisateur (entrée API)."""

    email: EmailStr
    full_name: FullNameStr
    role: Literal["ADMIN", "MEMBER"]


class PasswordChangeIn(BaseModel):
    """Payload de changement de mot de passe (entrée API)."""

    old_password: str
    new_password: PasswordStr
    confirm: Optional[str] = None

    @model_validator(mode="after")
    def _confirm_matches(self):
        """Valide que `confirm` correspond à `new_password` si `confirm` est fourni."""
        if self.confirm is not None and self.new_password != self.confirm:
            raise ValueError("La confirmation du mot de passe ne correspond pas")
        return self
