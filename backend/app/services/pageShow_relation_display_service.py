from typing import Any, Type


from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.models.option import Option
from app.models.question_category import QuestionCategory
from app.models.question_global import QuestionGlobal
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from app.schemas.pageAll import PageAllLangEnum
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


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


def _relation_display_config(
    lang: PageAllLangEnum | str,
) -> dict[str, tuple[Type[Any], str, Any]]:
    return {
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


async def enrich_show_relation_display_names(
    db: AsyncSession,
    data: dict[str, Any],
    lang: PageAllLangEnum | str = PageAllLangEnum.fr,
) -> dict[str, Any]:
    """
    Ajoute des champs lisibles aux données d'une page Show.

    Exemple :
    - commune_uid reste disponible et modifiable
    - commune_name est ajouté pour l'affichage en lecture seule

    Aucun champ *_name n'est destiné à être modifié directement.
    """

    if not data:
        return data

    relation_configs = _relation_display_config(lang)

    for uid_key, (model, display_key, display_expr) in relation_configs.items():
        related_uid = data.get(uid_key)

        if related_uid is None:
            continue

        stmt = select(display_expr.label("display_name")).where(model.uid == related_uid)

        result = await db.execute(stmt)
        display_name = result.scalar_one_or_none()

        data[display_key] = display_name

    return data
