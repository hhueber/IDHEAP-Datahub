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
from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession


ModelType = Type[Base]


class EntityConfig:
    def __init__(
        self,
        model: ModelType,
        code_attr: Optional[str],
        name_attr: str,
        search_extra_attrs: Optional[List[str]] = None,
    ):
        self.model = model
        self.code_attr = code_attr  # None si pas de code
        self.name_attr = name_attr  # "name" / "label" / "label_" / ...
        self.search_extra_attrs: List[str] = search_extra_attrs or []


ENTITY_CONFIG: Dict[EntityEnum, EntityConfig] = {
    # Commune : on ajoute les colonnes de nom localisées pour la recherche
    EntityEnum.commune: EntityConfig(
        Commune,
        "code",
        "name",
        search_extra_attrs=[
            "name_fr",
            "name_de",
            "name_it",
            "name_ro",
            "name_en",
        ],
    ),
    EntityEnum.district: EntityConfig(District, "code", "name"),
    EntityEnum.canton: EntityConfig(Canton, "code", "name"),
    EntityEnum.question_per_survey: EntityConfig(QuestionPerSurvey, "code", "label"),
    EntityEnum.question_global: EntityConfig(QuestionGlobal, None, "label"),
    EntityEnum.question_category: EntityConfig(
        QuestionCategory,
        None,
        "label",
        search_extra_attrs=[
            "text_fr",
            "text_de",
            "text_it",
            "text_ro",
            "text_en",
        ],
    ),
    # Option : code = value, name = label_ (fallback sur value)
    EntityEnum.option: EntityConfig(Option, "value", "label_"),
    # Survey : pas de code, name = name, + year
    EntityEnum.survey: EntityConfig(Survey, None, "name"),
}


def _build_columns_for_entity(entity: EntityEnum, cfg: EntityConfig):
    """
    Colonnes standard à sélectionner pour AllItem (uid, code?, name, year?).
    Réutilisé par la pagination et la recherche.
    """
    model = cfg.model
    name_col = getattr(model, cfg.name_attr).label("name")
    columns = [model.uid, name_col]

    if cfg.code_attr:
        code_col = getattr(model, cfg.code_attr).label("code")
        columns.insert(1, code_col)  # uid, code, name

    if entity == EntityEnum.survey:
        columns.append(model.year.label("year"))

    return columns


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

    columns = _build_columns_for_entity(entity, cfg)

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


async def suggest_pageAll_prefix(
    db: AsyncSession,
    *,
    entity: EntityEnum,
    q: str,
    limit: int = 10,
) -> List[AllItem]:
    """
    Recherche préfixe générique sur name / code (+ colonnes extra si définies).
    Retourne une liste d'AllItem, réutilisable partout (PageAll, autocomplete, etc.).
    """
    cfg = ENTITY_CONFIG.get(entity)
    if cfg is None:
        raise ValueError(f"Unsupported entity: {entity}")

    model = cfg.model

    if not q or len(q.strip()) < 3:
        return []

    q = q.strip().lower()
    u, l = func.unaccent, func.lower
    qprefix = f"{q}%"

    search_conditions = []

    # colonne principale de nom
    name_col = getattr(model, cfg.name_attr, None)
    if name_col is not None:
        search_conditions.append(l(u(name_col)).like(qprefix))

    # code si dispo
    if cfg.code_attr:
        code_col = getattr(model, cfg.code_attr)
        search_conditions.append(l(u(code_col)).like(qprefix))

    # colonnes extra de recherche
    for attr in cfg.search_extra_attrs:
        if hasattr(model, attr):
            col = getattr(model, attr)
            search_conditions.append(l(u(col)).like(qprefix))

    if not search_conditions:
        return []

    columns = _build_columns_for_entity(entity, cfg)

    stmt = select(*columns).where(or_(*search_conditions)).limit(limit)

    res = await db.execute(stmt)
    rows = res.all()

    items: List[AllItem] = []
    for row in rows:
        code_value = getattr(row, "code", None)
        name_value = row.name
        year_value = getattr(row, "year", None)

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

    return items


async def get_page_for_uid(
    db: AsyncSession,
    *,
    entity: EntityEnum,
    uid: int,
    order_by: OrderByEnum = OrderByEnum.uid,
    order_dir: OrderDirEnum = OrderDirEnum.asc,
    per_page: int = 20,
) -> int:
    """
    Renvoie la page (1-based) sur laquelle se trouve un enregistrement donné (uid)
    en fonction du tri et du per_page.
    """
    cfg = ENTITY_CONFIG.get(entity)
    if cfg is None:
        raise ValueError(f"Unsupported entity: {entity}")

    model = cfg.model

    # On récupère la valeur de la colonne de tri pour ce uid
    if order_by == OrderByEnum.uid:
        sort_col = model.uid
    elif order_by == OrderByEnum.code and cfg.code_attr:
        sort_col = getattr(model, cfg.code_attr)
    else:
        sort_col = getattr(model, cfg.name_attr)

    sort_value_stmt = select(sort_col, model.uid).where(model.uid == uid)
    row = (await db.execute(sort_value_stmt)).first()

    # Si l'élément n'existe plus -> on renvoie page 1
    if row is None:
        return 1

    sort_value, target_uid = row

    # NB : on suppose ici que sort_col n'est pas NULL
    if order_dir == OrderDirEnum.asc:
        before_conditions = or_(
            sort_col < sort_value,
            and_(sort_col == sort_value, model.uid < target_uid),
        )
    else:
        # pour desc : les valeurs plus grandes sont "avant"
        before_conditions = or_(
            sort_col > sort_value,
            and_(sort_col == sort_value, model.uid < target_uid),
        )

    count_stmt = select(func.count(model.uid)).where(before_conditions)
    before_count = (await db.execute(count_stmt)).scalar_one()

    # index 0-based -> page 1-based
    index = before_count
    if per_page <= 0:
        per_page = 20

    page = index // per_page + 1
    return page
