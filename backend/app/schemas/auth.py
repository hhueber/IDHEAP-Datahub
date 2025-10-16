from typing import Optional


from pydantic import BaseModel, constr, EmailStr


# Modèles Pydantic (schémas de données) utilisés par l'API FastAPI.
# Ils décrivent la forme des objets échangés entre backend et frontend.


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_in: int


class UserLogin(BaseModel):
    email: EmailStr
    password: str
