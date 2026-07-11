from typing import Any, List, Optional, Type


from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.models.option import Option
from app.models.question_category import QuestionCategory
from app.models.question_category_option_association import QuestionCategoryOptionAssociation
from app.models.question_global import QuestionGlobal
from app.models.question_global_option_association import QuestionGlobalOptionAssociation
from app.models.question_option_association import QuestionOptionAssociation
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from app.repositories.pageShow_repo import ENTITY_MODEL_MAP
from app.schemas.pageAll import EntityEnum, PageAllLangEnum
from app.schemas.pageShow import ShowMetaChild
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


ASSOCIATION_MODEL_MAP = {
    "question_option_association": QuestionOptionAssociation,
    "question_global_option_association": QuestionGlobalOptionAssociation,
    "question_category_option_association": QuestionCategoryOptionAssociation,
}


SUPPORTED_LANGS = {"fr", "de", "it", "ro", "en"}


def _safe_lang(lang: PageAllLangEnum | str) -> str:
    value = lang.value if isinstance(lang, PageAllLangEnum) else str(lang)

    if value in SUPPORTED_LANGS:
        return value

    return "fr"


def _not_empty(column: Any) -> Any:
    return func.nullif(column, "")


def _coalesce_not_empty(*columns: Any | None) -> Any | None:
    valid_columns = [col for col in columns if col is not None]

    if not valid_columns:
        return None

    return func.coalesce(*[_not_empty(col) for col in valid_columns])


def _localized_name(model: Type[Any], lang: PageAllLangEnum | str) -> Any:
    safe_lang = _safe_lang(lang)

    translated_name = getattr(model, f"name_{safe_lang}", None)
    fallback_name = getattr(model, "name", None)

    return _coalesce_not_empty(translated_name, fallback_name)


def _localized_text_or_label(model: Type[Any], lang: PageAllLangEnum | str) -> Any:
    safe_lang = _safe_lang(lang)

    translated_text = getattr(model, f"text_{safe_lang}", None)

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


async def enrich_children_display_names(
    db: AsyncSession,
    rows: List[dict[str, Any]],
    lang: PageAllLangEnum | str = PageAllLangEnum.fr,
) -> List[dict[str, Any]]:
    """
    Ajoute des champs display-friendly aux enfants.

    Exemple :
    - commune_uid reste disponible
    - commune_name est ajouté pour l'affichage
    - survey_uid reste disponible
    - survey_name est ajouté pour l'affichage
    """

    if not rows:
        return rows

    relation_configs: dict[str, tuple[Type[Any], str, Any]] = {
        "commune_uid": (
            Commune,
            "commune_name",
            _localized_name(Commune, lang),
        ),
        "district_uid": (
            District,
            "district_name",
            _localized_name(District, lang),
        ),
        "canton_uid": (
            Canton,
            "canton_name",
            _localized_name(Canton, lang),
        ),
        "survey_uid": (
            Survey,
            "survey_name",
            Survey.name,
        ),
        "question_uid": (
            QuestionPerSurvey,
            "question_name",
            _localized_text_or_label(QuestionPerSurvey, lang),
        ),
        "question_global_uid": (
            QuestionGlobal,
            "question_global_name",
            _localized_text_or_label(QuestionGlobal, lang),
        ),
        "question_category_uid": (
            QuestionCategory,
            "question_category_name",
            _localized_text_or_label(QuestionCategory, lang),
        ),
        "option_uid": (
            Option,
            "option_name",
            _localized_text_or_label(Option, lang),
        ),
    }

    for uid_key, (model, display_key, display_expr) in relation_configs.items():
        ids = {row.get(uid_key) for row in rows if row.get(uid_key) is not None}

        if not ids:
            continue

        stmt = select(
            model.uid.label("uid"),
            display_expr.label("display_name"),
        ).where(model.uid.in_(ids))

        result = await db.execute(stmt)

        names_by_uid = {row.uid: row.display_name for row in result.all()}

        for row in rows:
            related_uid = row.get(uid_key)

            if related_uid is None:
                continue

            row[display_key] = names_by_uid.get(related_uid)

    return rows


async def get_children_paginated(
    db: AsyncSession,
    child_entity: EntityEnum,
    child_meta: ShowMetaChild,
    parent_uid: int,
    page: int,
    per_page: int,
) -> tuple[List[Any], int]:
    model: Optional[Type[Any]] = ENTITY_MODEL_MAP.get(child_entity)
    if model is None:
        return [], 0

    offset = (page - 1) * per_page

    if child_meta.relation_type == "direct":
        if not child_meta.fk_field:
            return [], 0

        fk_col = getattr(model, child_meta.fk_field, None)
        if fk_col is None:
            return [], 0

        where_clause = fk_col == parent_uid

        total_req = select(func.count()).select_from(model).where(where_clause)
        total_res = await db.execute(total_req)
        total = int(total_res.scalar() or 0)

        req = select(model).where(where_clause).offset(offset).limit(per_page)
        res = await db.execute(req)
        items = list(res.scalars().all())
        return items, total

    if child_meta.relation_type == "association":
        if (
            not child_meta.association_table
            or not child_meta.association_source_field
            or not child_meta.association_target_field
        ):
            return [], 0

        association_model = ASSOCIATION_MODEL_MAP.get(child_meta.association_table)
        if association_model is None:
            return [], 0

        source_col = getattr(association_model, child_meta.association_source_field, None)
        target_col = getattr(association_model, child_meta.association_target_field, None)
        target_uid_col = getattr(model, child_meta.target_uid_field, None)

        if source_col is None or target_col is None or target_uid_col is None:
            return [], 0

        total_req = (
            select(func.count())
            .select_from(model)
            .join(association_model, target_uid_col == target_col)
            .where(source_col == parent_uid)
        )
        total_res = await db.execute(total_req)
        total = int(total_res.scalar() or 0)

        req = (
            select(model)
            .join(association_model, target_uid_col == target_col)
            .where(source_col == parent_uid)
            .offset(offset)
            .limit(per_page)
        )
        res = await db.execute(req)
        items = list(res.scalars().all())
        return items, total

    return [], 0
