import re


from app.repositories import user_repo
from sqlalchemy.ext.asyncio import AsyncSession


async def ensure_root_exists(
    db: AsyncSession, root_email: str, root_password: str, root_first_name: str, root_last_name: str
):
    if not await user_repo.any_admin_exists(db):
        user = await user_repo.create_user(
            db, root_email, root_password, first_name=root_first_name, last_name=root_last_name, role="ADMIN"
        )
        return user
    return None


def normalize_name(s: str) -> str:
    # - supprime espaces en trop (tout type d’espace)
    # - trim
    # - casse insensible (casefold > lower pour l’Unicode)
    return re.sub(r"\s+", " ", s).strip().casefold()
