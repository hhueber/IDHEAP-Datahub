# calcule le point central des communes
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.commune_map import CommuneMap

async def get_commune_point(db: AsyncSession, commune_uid: int):
    geom_sub = (
        select(CommuneMap.geometry)
        .where(CommuneMap.commune_uid == commune_uid)
        .order_by(CommuneMap.year.desc())
        .limit(1)
        .subquery()
    )
    q = select(
        func.ST_Y(func.ST_PointOnSurface(geom_sub.c.geometry)).label("lat"),
        func.ST_X(func.ST_PointOnSurface(geom_sub.c.geometry)).label("lon"),
    )
    res = await db.execute(q)
    row = res.mappings().first()
    return (float(row["lat"]), float(row["lon"])) if row else None
