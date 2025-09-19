from fastapi import Response
from app.core.config import settings

def set_auth_cookie(response: Response, token: str) -> None:
    """Utilitaire pour poser le cookie avec les mêmes attributs qu’au login."""
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,      # True en prod (HTTPS)
        samesite="lax",    # adapte au besoin
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=False,      # doit MATCH ce que tu mets dans set_auth_cookie
        samesite="lax",    # idem
        path="/",
    )