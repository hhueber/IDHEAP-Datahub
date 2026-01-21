from typing import Any, Dict, List, Optional, Type


from app.repositories.pageShow_repo import ENTITY_MODEL_MAP
from app.schemas.pageAll import EntityEnum
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_children_paginated(
    db: AsyncSession,
    child_entity: EntityEnum,
    fk_field: str,
    parent_uid: int,
    page: int,
    per_page: int,
) -> tuple[List[Any], int]:
    model: Optional[Type[Any]] = ENTITY_MODEL_MAP.get(child_entity)
    if model is None:
        return [], 0

    fk_col = getattr(model, fk_field, None)
    if fk_col is None:
        return [], 0

    where_clause = fk_col == parent_uid

    total_req = select(func.count()).select_from(model).where(where_clause)
    total_res = await db.execute(total_req)
    total = int(total_res.scalar() or 0)

    offset = (page - 1) * per_page
    req = select(model).where(where_clause).offset(offset).limit(per_page)
    res = await db.execute(req)
    items = list(res.scalars().all())

    return items, total
