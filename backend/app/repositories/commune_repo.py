from typing import List
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.commune import Commune

async def suggest_communes_prefix(db: AsyncSession, q: str, limit: int = 10) -> List[dict]:
    if not q or len(q.strip()) < 3:
        return []
    q = q.strip().lower()
    u, l = func.unaccent, func.lower
    qprefix = f"{q}%"

    stmt = (
        select(
            Commune.uid, Commune.code, Commune.name,
            Commune.name_fr, Commune.name_de, Commune.name_it, Commune.name_ro, Commune.name_en,
        )
        .where(or_(
            l(u(Commune.name)).like(qprefix),
            l(u(Commune.name_fr)).like(qprefix),
            l(u(Commune.name_de)).like(qprefix),
            l(u(Commune.name_it)).like(qprefix),
            l(u(Commune.name_ro)).like(qprefix),
            l(u(Commune.name_en)).like(qprefix),
            l(u(Commune.code)).like(qprefix),
        ))
        .limit(limit)
    )
    res = await db.execute(stmt)
    return [dict(r) for r in res.mappings().all()]