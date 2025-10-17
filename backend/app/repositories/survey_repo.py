from typing import Sequence


from app.models.survey import Survey
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def list_surveys_uid_year(db: AsyncSession) -> Sequence[tuple[int, int]]:
    """Returns [(uid, year), ...] sorted by year."""
    stmt = select(Survey.uid, Survey.year).order_by(Survey.year.asc())
    res = await db.execute(stmt)
    return res.all()


async def count_surveys(db: AsyncSession) -> int:
    stmt = select(func.count(Survey.uid))
    res = await db.execute(stmt)
    return int(res.scalar_one())
