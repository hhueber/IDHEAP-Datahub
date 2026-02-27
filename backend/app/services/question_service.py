from app.repositories.answer_repo import (
    list_available_years_for_question_global,
    list_available_years_for_question_per_survey,
)
from app.repositories.question_repo import list_questions_by_survey, normalize_lang
from app.schemas.questions import QuestionItem, QuestionList
from sqlalchemy.ext.asyncio import AsyncSession


async def get_questions_by_survey(db: AsyncSession, survey_uid: int, accept_language: str | None) -> QuestionList:
    lang = normalize_lang(accept_language)
    rows = await list_questions_by_survey(db, survey_uid, lang)  # (uid, label, text)
    items = [QuestionItem(uid=uid, label=label, text=text) for (uid, label, text) in rows]
    return QuestionList(items=items)


async def get_available_years_for_question(
    db: AsyncSession,
    question_uid: int,
    scope: str,
) -> list[int]:
    if scope == "global":
        return await list_available_years_for_question_global(db, question_uid)
    return await list_available_years_for_question_per_survey(db, question_uid)
