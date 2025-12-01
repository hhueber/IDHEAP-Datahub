from typing import List, Optional


from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_commune_by_ofs(db: AsyncSession, ofs_id: str) -> Optional[Commune]:
    print(f"MAIS DIS VOIR JAMY {ofs_id}")
    req = select(Commune).where((Commune.code == ofs_id))
    res = await db.execute(req)
    return res.scalar_one_or_none()


async def get_district_by_ofs(db: AsyncSession, ofs_id: str) -> Optional[District]:
    req = select(District).where((District.code == ofs_id))
    res = await db.execute(req)
    return res.scalar_one_or_none()


async def get_canton_by_ofs(db: AsyncSession, ofs_id: str) -> Optional[Canton]:
    req = select(Canton).where((Canton.ofs_id == int(ofs_id)))
    res = await db.execute(req)
    return res.scalar_one_or_none()
