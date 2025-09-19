from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db import get_db
from app.core.security import verify_token
from app.repositories.user_repo import get_user_by_id
from app.models.user import User as UserModel

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token: Optional[str] = Cookie(default=None, alias="access_token"),
    db: AsyncSession = Depends(get_db),
) -> UserModel:
    """
    - Verify the JWT (signature/exp) and retrieve (sub, iat).
    - Reload the user by sub (id).
    - Verify iat == users.last_token_created_at (int(timestamp)).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    print("get_current_user")
    token = credentials.credentials if credentials else access_token
    if not token:
        print("no token")
        raise credentials_exception
    print("get_current_user2")
    verified = verify_token(token)
    if not verified:
        raise credentials_exception

    sub, iat = verified  # sub: str (user.id), iat: int (epoch seconds)

    user = await get_user_by_id(db, sub)
    if not user or not user.last_token_created_at:
        raise credentials_exception

    db_iat = int(user.last_token_created_at.timestamp())
    if int(iat) != db_iat:
        # token issued before the last known iat → invalid
        raise credentials_exception

    return user