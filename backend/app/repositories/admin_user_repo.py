from typing import Literal, Optional


from app.config.roles import PermissionRole
from app.models.user import User
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession


AdminUserSortBy = Literal[
    "first_name",
    "last_name",
    "email",
    "role",
    "created_at",
]

AdminUserSortDir = Literal["asc", "desc"]


SORT_COLUMNS = {
    "first_name": User.first_name,
    "last_name": User.last_name,
    "email": User.email,
    "role": User.role,
    "created_at": User.created_at,
}


async def list_admin_users(
    db: AsyncSession,
    *,
    page: int,
    per_page: int,
    order_by: AdminUserSortBy,
    order_dir: AdminUserSortDir,
    q: Optional[str] = None,
) -> tuple[list[User], int]:
    """Retourne les utilisateurs paginés pour l'administration."""

    page = max(page, 1)
    per_page = min(max(per_page, 1), 100)

    query = select(User)
    count_query = select(func.count(User.id))

    if q:
        pattern = f"%{q.strip()}%"
        condition = or_(
            User.first_name.ilike(pattern),
            User.last_name.ilike(pattern),
            User.email.ilike(pattern),
            User.role.ilike(pattern),
        )
        query = query.where(condition)
        count_query = count_query.where(condition)

    sort_col = SORT_COLUMNS.get(order_by, User.last_name)
    sort_expr = desc(sort_col) if order_dir == "desc" else asc(sort_col)

    query = (
        query.order_by(sort_expr, asc(User.last_name), asc(User.first_name))
        .offset((page - 1) * per_page)
        .limit(per_page)
    )

    users_result = await db.execute(query)
    total_result = await db.execute(count_query)

    return list(users_result.scalars().all()), int(total_result.scalar_one())


async def get_admin_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    """Récupère un utilisateur par son id."""

    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def email_exists_for_other_user(
    db: AsyncSession,
    *,
    email: str,
    user_id: str,
) -> bool:
    """Vérifie si un email est déjà utilisé par un autre utilisateur."""

    result = await db.execute(select(User.id).where(User.email == email).where(User.id != user_id).limit(1))
    return result.scalar_one_or_none() is not None


async def update_admin_user(
    db: AsyncSession,
    *,
    user: User,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    email: Optional[str] = None,
    role: Optional[PermissionRole] = None,
) -> User:
    """Met à jour un utilisateur depuis la page admin."""

    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if email is not None:
        user.email = email
    if role is not None:
        user.role = role

    await db.commit()
    await db.refresh(user)
    return user


async def delete_admin_user(db: AsyncSession, *, user: User) -> None:
    """Supprime un utilisateur."""

    await db.delete(user)
    await db.commit()
