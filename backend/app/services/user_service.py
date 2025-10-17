from app.repositorie import user_repo
from sqlalchemy.ext.asyncio import AsyncSession


async def ensure_root_exists(db: AsyncSession, root_email: str, root_password: str, root_name: str):
    if not await user_repo.any_admin_exists(db):
        user = await user_repo.create_user(db, root_email, root_password, root_name, role="ADMIN")
        return user
    return None
