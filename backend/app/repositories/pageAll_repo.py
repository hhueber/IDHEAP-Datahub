from typing import Dict, List, Tuple, Type


from app.models.base import Base
from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.schemas.pageAll import AllItem, EntityEnum, OrderByEnum, OrderDirEnum
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


ModelType = Type[Base]


ENTITY_MODEL_MAP: Dict[EntityEnum, ModelType] = {
    EntityEnum.commune: Commune,
    EntityEnum.district: District,
    EntityEnum.canton: Canton,
}


async def get_pageAll_paginated(
    db: AsyncSession,
    *,
    entity: EntityEnum,
    page: int = 1,
    per_page: int = 20,
    order_by: OrderByEnum = OrderByEnum.uid,
    order_dir: OrderDirEnum = OrderDirEnum.asc,
) -> Tuple[List[AllItem], int]:
    """
    Template générique pour récupérer (uid, code, name) d'une table donnée
    avec tri par uid / code / name.
    """
    model = ENTITY_MODEL_MAP.get(entity)
    if model is None:
        raise ValueError(f"Unsupported entity: {entity}")

    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 10

    # total
    total_stmt = select(func.count(model.uid))
    total = (await db.execute(total_stmt)).scalar_one()

    # colonne de tri (toutes les entités doivent avoir uid/code/name)
    column = getattr(model, order_by.value)

    if order_dir == OrderDirEnum.asc:
        order_expr = column.asc()
    else:
        order_expr = column.desc()

    # page
    offset = (page - 1) * per_page
    stmt = select(model.uid, model.code, model.name).order_by(order_expr).offset(offset).limit(per_page)
    result = await db.execute(stmt)
    rows = result.all()

    items: List[AllItem] = [
        AllItem(
            uid=row.uid,
            code=row.code,
            name=row.name,
            entity=entity,
        )
        for row in rows
    ]

    return items, total
