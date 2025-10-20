from app.api.dependencies import get_current_user
from app.core.security import get_password_hash, verify_password
from app.db import get_db
from app.models.user import User as UserModel
from app.repositories.user_repo import create_user_record, delete_user_by_instance, update_user_password_hash
from app.schemas.user import PasswordChangeIn, Role, User, UserCreate, UserDeleteIn, UserPublic
from app.services.user_service import normalize_name
from fastapi import APIRouter, Depends, HTTPException, Response, status
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


def ensure_admin(u: UserPublic):
    if u.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")


@router.post("/addUser")
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    ensure_admin(current_user)

    exists = await db.scalar(select(UserModel.id).where(UserModel.email == payload.email))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    pwd_hash = get_password_hash(payload.password)
    await create_user_record(
        db,
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        password_hash=pwd_hash,
    )

    return {
        "success": True,
        "detail": "User created",
    }


@router.post("/deleteUser")
async def delete_user(
    payload: UserDeleteIn,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Deletes a user (operation reserved for administrators).
        - Verifies that the caller is an administrator.
        - Searches for the user by email.
        - Validates the identity (standardised full_name + role) before deletion.
        - Prevents the deletion of their own account.

    Args:
        payload (UserDeleteIn): Identification data of the user to be deleted
            (email, full_name, role).
        db (AsyncSession): Database session (dependency injection).
        current_user (UserModel): Guarantees that User has a valid cookie (auth required) and
        the UserModel mask guarantees that the information returned is in accordance with the UserModel schema.

    """
    ensure_admin(current_user)

    result = await db.execute(select(UserModel).where(UserModel.email == payload.email))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # permet de normaliser la string pour comparer les informations
    if normalize_name(target.full_name) != normalize_name(payload.full_name) or target.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Les informations fournies ne correspondent pas à l'utilisateur",
        )

    # empêcher l'admin de se supprimer lui-même
    if target.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible de supprimer votre propre compte"
        )

    await delete_user_by_instance(db, target)

    return {"success": True, "detail": "User deleted"}


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
