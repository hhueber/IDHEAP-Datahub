from app.api.dependencies import get_current_user
from app.config.roles import PermissionLevel, PermissionScope
from app.models.user import User as UserModel
from app.services.permission_service import role_has_permission
from fastapi import Depends, HTTPException, status


def require_permission(
    scope: PermissionScope,
    level: PermissionLevel,
):
    async def dependency(
        current_user: UserModel = Depends(get_current_user),
    ) -> UserModel:
        allowed = role_has_permission(
            current_user.role,
            scope=scope,
            level=level,
        )

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )

        return current_user

    return dependency
