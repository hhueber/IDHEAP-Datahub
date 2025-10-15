from datetime import datetime
from typing import Optional


from app.core.security import get_password_hash, verify_password
from app.models.user import User
from sqlalchemy import select, update
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    q = select(User).where(User.email == email)
    res = await db.execute(q)
    return res.scalars().first()


async def get_user_by_id(db: AsyncSession, id: str) -> Optional[User]:
    q = select(User).where(User.id == id)
    res = await db.execute(q)
    return res.scalars().first()


async def create_user(db: AsyncSession, email: str, password: str, full_name: str, role: str = "MEMBER") -> User:
    user = User(
        email=email,
        password_hash=get_password_hash(password),
        full_name=full_name,
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def any_admin_exists(db: AsyncSession) -> bool:
    q = select(User).where(User.role == "ADMIN").limit(1)
    res = await db.execute(q)
    return res.scalars().first() is not None


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def mark_token_created(db: AsyncSession, user_id: str) -> datetime:
    """
    Enregistre dans la DB l'instant de création du dernier token et le retourne.
    On utilise un datetime UTC.
    """
    issued_at = datetime.utcnow()
    await db.execute(update(User).where(User.id == user_id).values(last_token_created_at=issued_at))
    await db.commit()
    return issued_at


async def create_user_record(db: AsyncSession, *, email: str, full_name: str, role: str, password_hash: str) -> User:
    """Insère un utilisateur et commit."""
    user = User(
        email=email,
        full_name=full_name,
        role=role,
        password_hash=password_hash,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user_by_instance(db: AsyncSession, user: User) -> None:
    """Supprime l'utilisateur donné et commit."""
    await db.delete(user)
    await db.commit()


async def update_user_password_hash(db: AsyncSession, user: User, new_hash: str) -> None:
    """Met à jour le hash du mot de passe et commit."""
    user.password_hash = new_hash
    await db.commit()
