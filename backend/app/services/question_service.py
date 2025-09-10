from app.repositories.question_repo import list_questions_by_survey, normalize_lang
from app.schemas.questions import QuestionList, QuestionMeta
from sqlalchemy.ext.asyncio import AsyncSession


async def get_questions_by_survey(db: AsyncSession, survey_uid: int, accept_language: str | None) -> QuestionList:
    lang = normalize_lang(accept_language)
    # TODO: changer label par la question dans la langue demandée
    rows = await list_questions_by_survey(db, survey_uid, lang)
    items = [QuestionMeta(uid=uid, code=code, label=(label or code), group=group) for (uid, code, label, group) in rows]
    return QuestionList(items=items)
