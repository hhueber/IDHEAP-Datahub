from typing import Optional, Sequence


from app.models.question_global import QuestionGlobal
from app.models.question_per_survey import QuestionPerSurvey
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement


# Utilitaire : map langue -> nom de colonne
LANG_COL = {
    "fr": "text_fr",
    "de": "text_de",
    "it": "text_it",
    "rm": "text_ro",
    "en": "text_en",
}


def normalize_lang(lang_header: Optional[str]) -> str:
    if not lang_header:
        return "en"
    code = lang_header.split(",")[0].strip().lower()
    base = code.split("-")[0] if "-" in code else code
    return base


def _clean_lang_col(lang_col: ColumnElement) -> ColumnElement:
    """Nettoie la colonne de langue :
    - NULL / '' / 'nan' (insensible à la casse) / 'Not available for the moment' -> ''
    - sinon TRIM(valeur)
    Pas de fallback vers label ici.
    """
    trimmed = func.trim(lang_col)
    lower_trimmed = func.lower(trimmed)
    return case(
        (trimmed.is_(None), ""),  # NULL -> ''
        (trimmed == "", ""),  # vide -> ''
        (lower_trimmed == "nan", ""),  # 'nan' -> ''
        (lower_trimmed == "not available for the moment", ""),  # phrase spéciale -> ''
        else_=trimmed,
    )


# Globals
async def list_global_questions(db: AsyncSession, lang: str) -> Sequence[tuple[int, str, str]]:
    """Récupère les questions globales.

    :return: [(uid, label, text), ...] dans la langue demandée (ou '' si pas dispo pour le text).
    """
    col_name = LANG_COL.get(lang)
    if not col_name:
        text_expr = literal("", type_=QuestionGlobal.text_en.type).label("text")
    else:
        lang_col = getattr(QuestionGlobal, col_name)
        text_expr = _clean_lang_col(lang_col).label("text")

    stmt = select(
        QuestionGlobal.uid,
        QuestionGlobal.label,
        text_expr,
    ).order_by(QuestionGlobal.uid.asc())
    res = await db.execute(stmt)
    return res.all()  # (uid, label, text)


# Per `Survey`
async def list_questions_by_survey(db: AsyncSession, survey_uid: int, lang: str) -> Sequence[tuple[int, str, str]]:
    """Récupère les questions d'un sondage spécifique.

    :return: [(uid, label, text), ...] dans la langue demandée (ou '' si pas dispo pour le text).
    """
    col_name = LANG_COL.get(lang)
    if not col_name:
        text_expr = literal("", type_=QuestionPerSurvey.text_en.type).label("text")
    else:
        lang_col = getattr(QuestionPerSurvey, col_name)
        text_expr = _clean_lang_col(lang_col).label("text")

    stmt = (
        select(
            QuestionPerSurvey.uid,
            QuestionPerSurvey.label,
            text_expr,
        )
        .where(QuestionPerSurvey.survey_uid == survey_uid)
        .order_by(QuestionPerSurvey.code.asc())
    )
    res = await db.execute(stmt)
    return res.all()  # (uid, label, text)
