from typing import Dict, List, Optional, Tuple, Type


from app.models.base import Base
from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.models.option import Option
from app.models.question_category import QuestionCategory
from app.models.question_global import QuestionGlobal
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from app.schemas.pageAll import AllItem, EntityEnum, OrderByEnum, OrderDirEnum
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


ModelType = Type[Base]


class EntityConfig:
    def __init__(
        self,
        model: ModelType,
        code_attr: Optional[str],
        name_attr: str,
    ):
        self.model = model
        self.code_attr = code_attr  # None si pas de code
        self.name_attr = name_attr  # "name" / "label" / "label_" / ...


ENTITY_CONFIG: Dict[EntityEnum, EntityConfig] = {
    EntityEnum.commune: EntityConfig(Commune, "code", "name"),
    EntityEnum.district: EntityConfig(District, "code", "name"),
    EntityEnum.canton: EntityConfig(Canton, "code", "name"),
    EntityEnum.question_per_survey: EntityConfig(QuestionPerSurvey, "code", "label"),
    EntityEnum.question_global: EntityConfig(QuestionGlobal, None, "label"),
    EntityEnum.question_category: EntityConfig(QuestionCategory, None, "label"),
    # Option : code = value, name = label_ (fallback sur value)
    EntityEnum.option: EntityConfig(Option, "value", "label_"),
    # Survey : pas de code, name = name, + year
    EntityEnum.survey: EntityConfig(Survey, None, "name"),
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
    Template générique pour récupérer (uid, code?, name, year?) d'une table donnée
    avec tri par uid / name.
    """
    cfg = ENTITY_CONFIG.get(entity)
    if cfg is None:
        raise ValueError(f"Unsupported entity: {entity}")

    model = cfg.model

    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 10

    # total
    total_stmt = select(func.count(model.uid))
    total = (await db.execute(total_stmt)).scalar_one()

    # colonne de tri
    if order_by == OrderByEnum.uid:
        order_column = model.uid
    elif order_by == OrderByEnum.code and cfg.code_attr:
        order_column = getattr(model, cfg.code_attr)
    else:
        order_column = getattr(model, cfg.name_attr)

    order_expr = order_column.asc() if order_dir == OrderDirEnum.asc else order_column.desc()

    # colonnes sélectionnées de base
    name_col = getattr(model, cfg.name_attr).label("name")
    columns = [model.uid, name_col]

    if cfg.code_attr:
        code_col = getattr(model, cfg.code_attr).label("code")
        columns.insert(1, code_col)  # uid, code, name
    # colonnes supplémentaires selon l'entité
    if entity == EntityEnum.survey:
        columns.append(model.year.label("year"))

    stmt = select(*columns).order_by(order_expr).offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(stmt)
    rows = result.all()

    items: List[AllItem] = []
    for row in rows:
        code_value = getattr(row, "code", None)
        name_value = row.name
        year_value = getattr(row, "year", None)

        # cas spécial Option : si label_ est NULL -> fallback sur value (= code)
        if entity == EntityEnum.option and not name_value:
            name_value = code_value or ""

        items.append(
            AllItem(
                uid=row.uid,
                code=code_value,
                name=name_value,
                entity=entity,
                year=year_value,
            )
        )

    return items, total
