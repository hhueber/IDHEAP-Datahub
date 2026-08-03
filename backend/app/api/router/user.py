import math


from app.api.dependencies import get_current_user
from app.api.permissions import require_permission
from app.config.roles import PermissionLevel, PermissionScope
from app.core.security import get_password_hash, verify_password
from app.db import get_db
from app.models.user import User as UserModel
from app.repositories.admin_user_repo import (
    AdminUserSortBy,
    AdminUserSortDir,
    delete_admin_user,
    email_exists_for_other_user,
    get_admin_user_by_id,
    list_admin_users,
    update_admin_user,
)
from app.repositories.user_repo import create_user_record, delete_user_by_instance, update_user_password_hash
from app.schemas.user import (
    AdminUserActionResponse,
    AdminUserListResponse,
    AdminUserUpdateIn,
    PasswordChangeIn,
    User,
    UserCreate,
    UserDeleteIn,
    UserPublic,
)
from app.services.permission_service import role_can_manage_role
from app.services.user_service import normalize_name
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.get("/me", response_model=UserPublic)
def get_current_user_profile(current_user: UserModel = Depends(get_current_user)):
    """Get current user's profile.

    Returns the complete profile information for the authenticated user,
    including private information like email address.
    """
    return current_user


@router.post("/addUser")
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.WRITE)),
):
    """Create a new user (admin-only operation).
        - Requires the caller to be an administrator.
        - Fails with 409 if the email already exists.
        - Hashes the provided password and persists the user.

    Args:
        payload (UserCreate): New user's data (email, full_name, role, password).
        db (AsyncSession): Database session (dependency injection).
        current_user (UserModel): Guarantees that User has a valid cookie (auth required) and
        the User mask guarantees that the information returned is in accordance with the User schema.

    """
    if not role_can_manage_role(current_user.role, payload.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to create a user with this role",
        )

    exists = await db.scalar(select(UserModel.id).where(UserModel.email == payload.email))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    pwd_hash = get_password_hash(payload.password)
    await create_user_record(
        db,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        password_hash=pwd_hash,
    )

    return {
        "success": True,
        "detail": "User created",
    }


@router.post("/changePassword")
async def change_password(
    payload: PasswordChangeIn,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Changes the password of the authenticated user.
        - Verifies the old password.
        - Rejects if the new password is identical to the old one.
        - Updates the password hash in the database.

    Args:
        payload (PasswordChangeIn): Old and new passwords.
        db (AsyncSession): DB session (dependency injection).
        current_user (UserModel): Guarantees that User has a valid cookie (auth required) and
        the UserModel mask guarantees that the information returned is in accordance with the UserModel schema..

    """
    # On charge l'utilisateur courant
    user = await db.get(UserModel, current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Vérifie l'ancien mot de passe
    if not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ancien mot de passe incorrect")

    # empêcher la réutilisation du même mot de passe
    if verify_password(payload.new_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Le nouveau mot de passe doit être différent"
        )

    new_hash = get_password_hash(payload.new_password)
    await update_user_password_hash(db, user, new_hash)

    return {"success": True, "detail": "Mot de passe modifié"}


@router.get("/admin", response_model=AdminUserListResponse)
async def get_admin_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    order_by: AdminUserSortBy = "last_name",
    order_dir: AdminUserSortDir = "asc",
    q: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user: UserModel = Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.READ)),
):
    """
    Liste les comptes de la partie privée.

    Permission requise:
    - PROJECT READ
    """

    users, total = await list_admin_users(db, page=page, per_page=per_page, order_by=order_by, order_dir=order_dir, q=q)
    pages = max(1, math.ceil(total / per_page))

    return {
        "success": True,
        "detail": "Users loaded",
        "data": {
            "items": users,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages,
        },
    }


@router.patch("/admin/{user_id}", response_model=AdminUserActionResponse)
async def patch_admin_user(
    user_id: str,
    payload: AdminUserUpdateIn,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.WRITE)),
):
    """
    Modifie un utilisateur.

    Permission requise:
    - PROJECT WRITE
    """

    target = await get_admin_user_by_id(db, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not role_can_manage_role(current_user.role, target.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to edit this user")
    if payload.role is not None:
        if target.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot change your own role from this page"
            )
        if not role_can_manage_role(current_user.role, payload.role):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to assign this role")
    if payload.email is not None:
        exists = await email_exists_for_other_user(db, email=str(payload.email), user_id=target.id)
        if exists:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    await update_admin_user(
        db,
        user=target,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=str(payload.email) if payload.email is not None else None,
        role=payload.role,
    )

    return {
        "success": True,
        "detail": "User updated",
    }


@router.delete("/admin/{user_id}", response_model=AdminUserActionResponse)
async def remove_admin_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_permission(PermissionScope.PROJECT, PermissionLevel.MANAGE)),
):
    """
    Supprime un utilisateur.

    Permission requise:
    - PROJECT MANAGE
    """

    target = await get_admin_user_by_id(db, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")
    if not role_can_manage_role(current_user.role, target.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to delete this user")
    await delete_admin_user(db, user=target)

    return {
        "success": True,
        "detail": "User deleted",
    }
