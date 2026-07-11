from app.models.commune import Commune
from app.models.commune_map import CommuneMap
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_closest_year(db: AsyncSession, target_year: int):
    distinct_year_req = select(CommuneMap.year).distinct()
    result = await db.execute(distinct_year_req)
    available_years = [row[0] for row in result.all()]

    if not available_years:
        raise ValueError("Cannot find years")

    closest_year = min(available_years, key=lambda y: abs(y - target_year))
    return closest_year


async def get_commune_mapping_year(db: AsyncSession, year: int):
    target_year = 1989 if year == 1988 else year

    year_existing_req = select(CommuneMap.year == target_year).limit(1)
    year_existing_result = await db.execute(year_existing_req)

    if year_existing_result.scalar_one_or_none() is None:
        query_year = await get_closest_year(db, target_year)
    else:
        query_year = target_year

    query = {
        select(Commune.uid, Commune.code)
        .join(CommuneMap, Commune.uid == CommuneMap.commune_uid)
        .filter(CommuneMap.year == query_year)
    }

    result = await db.execute(query)
    return {row.code: row.uid for row in result.all()}
