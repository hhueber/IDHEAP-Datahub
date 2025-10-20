from datetime import timedelta


from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.security import create_access_token
from app.db import AsyncSessionLocal, get_db
from app.models.user import User as UserModel
from app.repositories.user_repo import authenticate_user, mark_token_created
from app.schemas.auth import Token, UserLogin
from app.schemas.user import User
from app.services.auth_service import clear_auth_cookie, set_auth_cookie
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate user by email and return access token."""
    user = await authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    iat_dt = await mark_token_created(db, user.id)

    payload = {
        "sub": user.id,
        "iat": int(iat_dt.timestamp()),
    }
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data=payload, expires_delta=access_token_expires)

    set_auth_cookie(response, access_token)

    total_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    # request to refresh this token in 55 minutes
    refresh_in = total_seconds - (5 * 60)

    return {"access_token": access_token, "token_type": "bearer", "refresh_in": refresh_in}


@router.post("/logout")
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """logout:
    - invalidates the current token by modifying last_token_created_at
    - deletes the “access_token” cookie
    """
    # Invalider le token courant en changeant last_token_created_at
    await db.execute(update(UserModel).where(UserModel.id == current_user.id).values(last_token_created_at=None))
    await db.commit()

    clear_auth_cookie(response)

    return {"ok": True}


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_access_token(
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Refreshes the access token:
    - requires a valid token (get_current_user)
    - updates last_token_created_at
    - issues a new JWT and replaces the cookie
    - immediately invalidates the old token (thanks to the new iat in DB)
    - request to refresh this token in 55 minutes
    """
    iat_dt = await mark_token_created(db, current_user.id)

    payload = {
        "sub": current_user.id,
        "iat": int(iat_dt.timestamp()),
    }
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data=payload, expires_delta=access_token_expires)

    set_auth_cookie(response, access_token)

    total_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    # request to refresh this token in 55 minutes
    refresh_in = total_seconds - (5 * 60)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_in": refresh_in,
    }
