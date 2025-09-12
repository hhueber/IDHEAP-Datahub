from app.repositories.question_repo import list_questions_by_survey, normalize_lang
from app.schemas.questions import QuestionList, QuestionItem
from sqlalchemy.ext.asyncio import AsyncSession

async def get_questions_by_survey(db: AsyncSession, survey_uid: int, accept_language: str | None) -> QuestionList:
    lang = normalize_lang(accept_language)
    rows = await list_questions_by_survey(db, survey_uid, lang)  # (uid, label, text)
    items = [QuestionItem(uid=uid, label=label, text=text) for (uid, label, text) in rows]
    return QuestionList(items=items)
