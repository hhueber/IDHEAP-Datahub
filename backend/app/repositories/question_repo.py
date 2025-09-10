from typing import Optional, Sequence


from app.models.question_global import QuestionGlobal
from app.models.question_per_survey import QuestionPerSurvey
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


# Utilitaire : map langue -> nom de colonne
LANG_COL = {
    "fr": "text_fr",
    "de": "text_de",
    "it": "text_it",
    "ro": "text_ro",
    "en": "text_en",
}


def normalize_lang(lang_header: Optional[str]) -> str:
    # TODO: definir la langue par défaut
    # "fr-CH" -> "fr", default "en"
    if not lang_header:
        return "en"
    code = lang_header.split(",")[0].strip().lower()
    base = code.split("-")[0] if "-" in code else code
    return base if base in LANG_COL else "en"


async def list_global_questions(db: AsyncSession, lang: str):
    col_name = LANG_COL.get(lang)
    col = getattr(QuestionGlobal, col_name, QuestionGlobal.text_en)

    stmt = (
        select(
            QuestionGlobal.uid,
            # QuestionGlobal.code,
            col.label("label"),
            # QuestionGlobal.group.label("group"),
        ).order_by(QuestionGlobal.uid.asc())
        # .order_by(QuestionGlobal.code.asc())
    )
    res = await db.execute(stmt)
    return res.all()  # list[tuple]


async def list_questions_by_survey(db: AsyncSession, survey_uid: int, lang: str):
    col_name = LANG_COL.get(lang, "text_en")
    col = getattr(QuestionPerSurvey, col_name, QuestionPerSurvey.text_en)
    # TODO: changer label et code par la question dans la langue demandée
    stmt = (
        select(
            QuestionPerSurvey.uid,
            QuestionPerSurvey.code,
            col.label("label"),
            QuestionPerSurvey.question_category_uid.label("group"),
        )
        .where(QuestionPerSurvey.survey_uid == survey_uid)
        .order_by(QuestionPerSurvey.code.asc())
    )
    res = await db.execute(stmt)
    return res.all()
