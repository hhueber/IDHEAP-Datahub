from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def load_effective_config(session: AsyncSession) -> dict[str, str]:
    """Retourne la config key/value à partir de la table config."""
    result = await session.execute(text("SELECT key, value FROM config"))
    rows = result.mappings().all()
    return {row["key"]: row["value"] for row in rows}
