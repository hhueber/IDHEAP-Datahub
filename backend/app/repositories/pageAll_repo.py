from typing import Any, Dict, List, Optional, Tuple, Type
import unicodedata


from app.models.answer import Answer
from app.models.base import Base
from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.models.option import Option
from app.models.question_category import QuestionCategory
from app.models.question_global import QuestionGlobal
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from app.schemas.pageAll import AllItem, EntityEnum, OrderByEnum, OrderDirEnum, PageAllLangEnum
from sqlalchemy import and_, case, cast, func, Integer, Numeric, or_, select, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select


ModelType = Type[Base]

SUPPORTED_LANGS = {"fr", "de", "it", "ro", "en"}


def _safe_lang(lang: PageAllLangEnum | str) -> str:
    value = lang.value if isinstance(lang, PageAllLangEnum) else str(lang)

    if value in SUPPORTED_LANGS:
        return value

    return "fr"


def _not_empty(column: Any) -> Any:
    """
    Transforme une chaîne vide en NULL.

    Cela permet à COALESCE de passer au fallback suivant si la traduction
    existe mais vaut "".
    """
    return func.nullif(column, "")


def _coalesce_not_empty(*columns: Any | None) -> Any | None:
    """
    Retourne le premier champ non NULL et non vide.
    """
    valid_columns = [col for col in columns if col is not None]

    if not valid_columns:
        return None

    return func.coalesce(*[_not_empty(col) for col in valid_columns])


def _localized_text_or_label(model: ModelType, lang: PageAllLangEnum | str) -> Any | None:
    """
    Pour les questions et options.

    Priorité :
    1. text_LANG
    2. label
    3. label_ pour Option
    4. value pour Option ou Answer
    5. name si disponible

    Exemple :
    - lang = fr
    - text_fr = NULL ou ""
    - label = "How satisfied are you?"

    Résultat :
    - "How satisfied are you?"
    """
    safe_lang = _safe_lang(lang)

    translated_text = getattr(model, f"text_{safe_lang}", None)

    # Attention :
    # Option a une property Python `label`, mais la vraie colonne SQL est `label_`.
    # Donc on ne doit pas utiliser Option.label dans une requête SQL.
    if model is Option:
        label = None
        label_ = Option.label_
    else:
        label = getattr(model, "label", None)
        label_ = getattr(model, "label_", None)

    value = getattr(model, "value", None)
    name = getattr(model, "name", None)

    return _coalesce_not_empty(
        translated_text,
        label,
        label_,
        value,
        name,
    )


def _localized_name(model: ModelType, lang: PageAllLangEnum | str) -> Any | None:
    """
    Pour les entités géographiques.

    Priorité :
    1. name_LANG
    2. name
    """
    safe_lang = _safe_lang(lang)

    translated_name = getattr(model, f"name_{safe_lang}", None)
    fallback_name = getattr(model, "name", None)

    return _coalesce_not_empty(translated_name, fallback_name)


class EntityConfig:
    def __init__(
        self,
        model: ModelType,
        code_attr: Optional[str],
        default_sort: OrderByEnum = OrderByEnum.name,
        search_extra_attrs: Optional[List[str]] = None,
    ):
        self.model = model
        self.code_attr = code_attr
        self.default_sort = default_sort
        self.search_extra_attrs = search_extra_attrs or []


ENTITY_CONFIG: Dict[EntityEnum, EntityConfig] = {
    EntityEnum.commune: EntityConfig(
        Commune,
        "code",
        default_sort=OrderByEnum.name,
        search_extra_attrs=[
            "name",
            "name_fr",
            "name_de",
            "name_it",
            "name_ro",
            "name_en",
            "code",
        ],
    ),
    EntityEnum.district: EntityConfig(
        District,
        "code",
        default_sort=OrderByEnum.name,
        search_extra_attrs=[
            "name",
            "name_fr",
            "name_de",
            "name_it",
            "name_ro",
            "name_en",
            "code",
        ],
    ),
    EntityEnum.canton: EntityConfig(
        Canton,
        "code",
        default_sort=OrderByEnum.name,
        search_extra_attrs=[
            "name",
            "name_fr",
            "name_de",
            "name_it",
            "name_ro",
            "name_en",
            "code",
        ],
    ),
    EntityEnum.question_per_survey: EntityConfig(
        QuestionPerSurvey,
        "code",
        default_sort=OrderByEnum.code,
        search_extra_attrs=[
            "code",
            "label",
            "text_fr",
            "text_de",
            "text_it",
            "text_ro",
            "text_en",
        ],
    ),
    EntityEnum.question_global: EntityConfig(
        QuestionGlobal,
        None,
        default_sort=OrderByEnum.name,
        search_extra_attrs=[
            "label",
            "text_fr",
            "text_de",
            "text_it",
            "text_ro",
            "text_en",
        ],
    ),
    EntityEnum.question_category: EntityConfig(
        QuestionCategory,
        None,
        default_sort=OrderByEnum.name,
        search_extra_attrs=[
            "label",
            "text_fr",
            "text_de",
            "text_it",
            "text_ro",
            "text_en",
        ],
    ),
    EntityEnum.option: EntityConfig(
        Option,
        "value",
        default_sort=OrderByEnum.name,
        search_extra_attrs=[
            "value",
            "label_",
            "text_fr",
            "text_de",
            "text_it",
            "text_ro",
            "text_en",
        ],
    ),
    EntityEnum.survey: EntityConfig(
        Survey,
        None,
        default_sort=OrderByEnum.year,
        search_extra_attrs=[
            "name",
        ],
    ),
    EntityEnum.answer: EntityConfig(
        Answer,
        None,
        default_sort=OrderByEnum.year,
        search_extra_attrs=[
            "value",
        ],
    ),
}


def _name_expr_for_entity(entity: EntityEnum, lang: PageAllLangEnum | str) -> Any | None:
    if entity in {
        EntityEnum.commune,
        EntityEnum.district,
        EntityEnum.canton,
    }:
        return _localized_name(ENTITY_CONFIG[entity].model, lang)

    if entity in {
        EntityEnum.question_per_survey,
        EntityEnum.question_global,
        EntityEnum.question_category,
        EntityEnum.option,
    }:
        return _localized_text_or_label(ENTITY_CONFIG[entity].model, lang)

    if entity == EntityEnum.survey:
        return Survey.name

    if entity == EntityEnum.answer:
        return Answer.value

    return None


def _build_columns_for_entity(entity: EntityEnum, lang: PageAllLangEnum | str) -> list[Any]:
    cfg = ENTITY_CONFIG[entity]
    model = cfg.model

    if entity == EntityEnum.answer:
        question_expr = _localized_text_or_label(QuestionPerSurvey, lang)
        commune_expr = _localized_name(Commune, lang)

        return [
            Answer.uid,
            Answer.value.label("name"),
            Answer.value.label("value"),
            Answer.year.label("year"),
            Answer.question_uid.label("question_uid"),
            Answer.commune_uid.label("commune_uid"),
            question_expr.label("question"),
            commune_expr.label("commune"),
        ]

    name_expr = _name_expr_for_entity(entity, lang)

    columns = [
        model.uid,
        name_expr.label("name"),
    ]

    if cfg.code_attr:
        code_col = getattr(model, cfg.code_attr).label("code")
        columns.insert(1, code_col)

    if entity == EntityEnum.survey:
        columns.append(Survey.year.label("year"))

    return columns


def _build_base_stmt(entity: EntityEnum, lang: PageAllLangEnum | str) -> Select[Any]:
    columns = _build_columns_for_entity(entity, lang)

    if entity == EntityEnum.answer:
        return (
            select(*columns)
            .select_from(Answer)
            .join(QuestionPerSurvey, QuestionPerSurvey.uid == Answer.question_uid)
            .join(Commune, Commune.uid == Answer.commune_uid)
        )

    return select(*columns)


def _build_count_stmt(entity: EntityEnum) -> Select[Any]:
    cfg = ENTITY_CONFIG[entity]
    model = cfg.model

    if entity == EntityEnum.answer:
        return (
            select(func.count(Answer.uid))
            .select_from(Answer)
            .join(QuestionPerSurvey, QuestionPerSurvey.uid == Answer.question_uid)
            .join(Commune, Commune.uid == Answer.commune_uid)
        )

    return select(func.count(model.uid))


def _order_column_for_entity(
    entity: EntityEnum,
    order_by: OrderByEnum,
    lang: PageAllLangEnum | str,
) -> Any | None:
    cfg = ENTITY_CONFIG[entity]
    model = cfg.model

    if order_by == OrderByEnum.code and cfg.code_attr:
        return getattr(model, cfg.code_attr)

    if order_by == OrderByEnum.year and hasattr(model, "year"):
        return getattr(model, "year")

    if order_by == OrderByEnum.value:
        if entity == EntityEnum.option:
            return Option.value
        if entity == EntityEnum.answer:
            return Answer.value

    if order_by == OrderByEnum.question and entity == EntityEnum.answer:
        return _localized_text_or_label(QuestionPerSurvey, lang)

    if order_by == OrderByEnum.commune and entity == EntityEnum.answer:
        return _localized_name(Commune, lang)

    return _name_expr_for_entity(entity, lang)


def _order_exprs_for_entity(
    entity: EntityEnum,
    order_by: OrderByEnum,
    order_dir: OrderDirEnum,
    lang: PageAllLangEnum | str,
) -> list[Any]:
    cfg = ENTITY_CONFIG[entity]
    model = cfg.model

    if order_by == OrderByEnum.code and cfg.code_attr:
        code_col = getattr(model, cfg.code_attr)
        order_columns = _natural_code_order_columns(code_col)

        if order_dir == OrderDirEnum.asc:
            return [col.asc() for col in order_columns]

        return [col.desc() for col in order_columns]

    if order_by == OrderByEnum.value and entity in {
        EntityEnum.option,
        EntityEnum.answer,
    }:
        value_col = Option.value if entity == EntityEnum.option else Answer.value
        order_columns = _natural_value_order_columns(value_col)

        if order_dir == OrderDirEnum.asc:
            return [col.asc() for col in order_columns]

        return [col.desc() for col in order_columns]

    order_column = _order_column_for_entity(entity, order_by, lang)

    if order_column is None:
        order_column = _order_column_for_entity(entity, cfg.default_sort, lang)

    if order_dir == OrderDirEnum.asc:
        return [order_column.asc()]

    return [order_column.desc()]


def _row_to_all_item(row, entity: EntityEnum) -> AllItem:
    code_value = getattr(row, "code", None)
    name_value = getattr(row, "name", None)
    year_value = getattr(row, "year", None)
    value_value = getattr(row, "value", None)
    question_uid_value = getattr(row, "question_uid", None)
    commune_uid_value = getattr(row, "commune_uid", None)
    question_value = getattr(row, "question", None)
    commune_value = getattr(row, "commune", None)

    if entity == EntityEnum.option and not name_value:
        name_value = code_value or value_value or ""

    if entity == EntityEnum.answer and not name_value:
        name_value = value_value or ""

    return AllItem(
        uid=row.uid,
        code=code_value,
        name=name_value or "",
        entity=entity,
        year=year_value,
        value=value_value,
        question_uid=question_uid_value,
        commune_uid=commune_uid_value,
        question=question_value,
        commune=commune_value,
    )


def _natural_value_order_columns(value_col: Any) -> list[Any]:
    """
    Construit un tri naturel pour les valeurs stockées en texte.

    Objectif :
    - les valeurs numériques sont triées comme des nombres
    - évite le mauvais ordre : 1, 1.0, 10, 11, 20, 3, 4

    Exemples :
    - 1, 1.0, 3, 4, 10, 11, 20
    - 1.5, 2.0, 2.5, 10
    """
    value_as_text = cast(value_col, String)
    normalized_value = func.replace(value_as_text, ",", ".")

    is_numeric_only = normalized_value.op("~")(r"^-?\d+(\.\d+)?$")

    numeric_value = case(
        (is_numeric_only, cast(normalized_value, Numeric)),
        else_=None,
    )

    return [
        case((is_numeric_only, 0), else_=1),
        numeric_value,
        normalized_value,
    ]


def _natural_code_order_columns(code_col: Any) -> list[Any]:
    """
    Construit un tri naturel pour les codes.

    Objectif :
    - les codes numériques sont triés comme des nombres
    - les codes textuels sont triés par préfixe puis par nombre
    - évite le mauvais ordre : 100, 1001, 101

    Exemples :
    - 100, 101, 1001
    - A2, A11, A100
    """
    code_as_text = cast(code_col, String)

    prefix = func.regexp_replace(code_as_text, r"\d+", "", "g")
    number_part = func.nullif(func.regexp_replace(code_as_text, r"\D+", "", "g"), "")

    is_numeric_only = code_as_text.op("~")(r"^\d+$")
    has_number = code_as_text.op("~")(r"\d+")

    numeric_value = case(
        (has_number, cast(number_part, Integer)),
        else_=None,
    )

    return [
        case((is_numeric_only, 0), else_=1),
        prefix,
        numeric_value,
        code_as_text,
    ]


def _normalize_search_text(value: str | None) -> str:
    if not value:
        return ""

    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    return value.lower().strip()


def _searchable_exprs_for_entity(
    entity: EntityEnum,
    lang: PageAllLangEnum | str,
) -> list[Any]:
    cfg = ENTITY_CONFIG[entity]
    model = cfg.model

    exprs: list[Any] = []

    name_expr = _name_expr_for_entity(entity, lang)

    if name_expr is not None:
        exprs.append(name_expr)

    if cfg.code_attr:
        exprs.append(getattr(model, cfg.code_attr))

    for attr in cfg.search_extra_attrs:
        if hasattr(model, attr):
            exprs.append(getattr(model, attr))

    if entity == EntityEnum.answer:
        question_expr = _localized_text_or_label(QuestionPerSurvey, lang)
        commune_expr = _localized_name(Commune, lang)

        if question_expr is not None:
            exprs.append(question_expr)

        if commune_expr is not None:
            exprs.append(commune_expr)

    return exprs


def _normalized_sql_text(expr: Any) -> Any:
    return func.lower(func.unaccent(cast(expr, String)))


async def get_pageAll_paginated(
    db: AsyncSession,
    *,
    entity: EntityEnum,
    page: int = 1,
    per_page: int = 20,
    order_by: OrderByEnum = OrderByEnum.name,
    order_dir: OrderDirEnum = OrderDirEnum.asc,
    lang: PageAllLangEnum = PageAllLangEnum.fr,
    q: str | None = None,
) -> Tuple[List[AllItem], int]:
    cfg = ENTITY_CONFIG.get(entity)

    if cfg is None:
        raise ValueError(f"Unsupported entity: {entity}")

    model = cfg.model

    if page < 1:
        page = 1

    if per_page < 1:
        per_page = 20

    search_conditions: list[Any] = []

    if q and q.strip():
        q_value = q.strip().lower()
        q_like = f"%{q_value}%"

        u = func.unaccent
        l = func.lower

        searchable_exprs = _searchable_exprs_for_entity(entity, lang)

        for expr in searchable_exprs:
            search_conditions.append(l(u(cast(expr, String))).like(q_like))

    total_stmt = _build_count_stmt(entity)

    if search_conditions:
        total_stmt = total_stmt.where(or_(*search_conditions))

    total = (await db.execute(total_stmt)).scalar_one()

    order_exprs = _order_exprs_for_entity(entity, order_by, order_dir, lang)

    stmt = _build_base_stmt(entity, lang)

    if search_conditions:
        stmt = stmt.where(or_(*search_conditions))

    stmt = stmt.order_by(*order_exprs, model.uid.asc()).offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(stmt)
    rows = result.all()

    items = [_row_to_all_item(row, entity) for row in rows]

    return items, total


async def suggest_pageAll(
    db: AsyncSession,
    *,
    entity: EntityEnum,
    q: str,
    limit: int = 10,
    lang: PageAllLangEnum = PageAllLangEnum.fr,
) -> List[AllItem]:
    cfg = ENTITY_CONFIG.get(entity)

    if cfg is None:
        raise ValueError(f"Unsupported entity: {entity}")

    model = cfg.model

    q_norm = _normalize_search_text(q)

    if len(q_norm) < 1:
        return []

    q_exact = q_norm
    q_prefix = f"{q_norm}%"
    q_contains = f"%{q_norm}%"

    searchable_exprs = _searchable_exprs_for_entity(entity, lang)

    if not searchable_exprs:
        return []

    rank_exprs: list[Any] = []
    search_conditions: list[Any] = []

    for expr in searchable_exprs:
        normalized_expr = _normalized_sql_text(expr)

        search_conditions.append(normalized_expr.like(q_contains))

        rank_exprs.append(
            case(
                (normalized_expr == q_exact, 0),
                (normalized_expr.like(q_prefix), 1),
                (normalized_expr.like(q_contains), 2),
                else_=9,
            )
        )

    best_rank = func.least(*rank_exprs).label("search_rank")

    stmt = (
        _build_base_stmt(entity, lang)
        .where(or_(*search_conditions))
        .order_by(
            best_rank.asc(),
            (
                _name_expr_for_entity(entity, lang).asc()
                if _name_expr_for_entity(entity, lang) is not None
                else model.uid.asc()
            ),
            model.uid.asc(),
        )
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [_row_to_all_item(row, entity) for row in rows]


async def get_page_for_uid(
    db: AsyncSession,
    *,
    entity: EntityEnum,
    uid: int,
    order_by: OrderByEnum = OrderByEnum.name,
    order_dir: OrderDirEnum = OrderDirEnum.asc,
    per_page: int = 20,
    lang: PageAllLangEnum = PageAllLangEnum.fr,
) -> int:
    cfg = ENTITY_CONFIG.get(entity)

    if cfg is None:
        raise ValueError(f"Unsupported entity: {entity}")

    model = cfg.model

    sort_col = _order_column_for_entity(entity, order_by, lang)

    if sort_col is None:
        sort_col = _order_column_for_entity(entity, cfg.default_sort, lang)

    if entity == EntityEnum.answer:
        uid_col = Answer.uid

        base_query = (
            select(sort_col, Answer.uid)
            .select_from(Answer)
            .join(QuestionPerSurvey, QuestionPerSurvey.uid == Answer.question_uid)
            .join(Commune, Commune.uid == Answer.commune_uid)
        )
    else:
        uid_col = model.uid
        base_query = select(sort_col, model.uid)

    row = (await db.execute(base_query.where(uid_col == uid))).first()

    if row is None:
        return 1

    sort_value, target_uid = row

    if order_dir == OrderDirEnum.asc:
        before_conditions = or_(
            sort_col < sort_value,
            and_(sort_col == sort_value, uid_col < target_uid),
        )
    else:
        before_conditions = or_(
            sort_col > sort_value,
            and_(sort_col == sort_value, uid_col < target_uid),
        )

    if entity == EntityEnum.answer:
        count_stmt = (
            select(func.count(Answer.uid))
            .select_from(Answer)
            .join(QuestionPerSurvey, QuestionPerSurvey.uid == Answer.question_uid)
            .join(Commune, Commune.uid == Answer.commune_uid)
            .where(before_conditions)
        )
    else:
        count_stmt = select(func.count(model.uid)).where(before_conditions)

    before_count = (await db.execute(count_stmt)).scalar_one()

    if per_page <= 0:
        per_page = 20

    return before_count // per_page + 1
