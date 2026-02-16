from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def list_available_years_for_question_per_survey(db: AsyncSession, question_uid: int) -> list[int]:
    stmt = (
        select(Survey.year)
        .join(QuestionPerSurvey, QuestionPerSurvey.survey_uid == Survey.uid)
        .where(QuestionPerSurvey.uid == question_uid)
        .limit(1)
    )
    res = await db.execute(stmt)
    return [int(r[0]) for r in res.all()]


async def list_available_years_for_question_global(db: AsyncSession, question_global_uid: int) -> list[int]:
    stmt = (
        select(Survey.year)
        .join(QuestionPerSurvey, QuestionPerSurvey.survey_uid == Survey.uid)
        .where(QuestionPerSurvey.question_global_uid == question_global_uid)
        .distinct()
        .order_by(Survey.year.asc())
    )
    res = await db.execute(stmt)
    return [int(r[0]) for r in res.all()]
