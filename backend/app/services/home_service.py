from app.repositories.question_repo import list_global_questions, normalize_lang
from app.repositories.survey_repo import list_surveys_uid_year
from app.schemas.questions import HomeBootstrap, QuestionList, QuestionMeta, SurveyBrief
from sqlalchemy.ext.asyncio import AsyncSession


async def get_home_bootstrap(db: AsyncSession, accept_language: str | None) -> HomeBootstrap:
    lang = normalize_lang(accept_language)

    # surveys
    rows = await list_surveys_uid_year(db)
    surveys = [SurveyBrief(uid=uid, year=year) for (uid, year) in rows]

    # global questions
    g_rows = await list_global_questions(db, lang)
    globals_list = [
        QuestionMeta(uid=uid, code=code, label=(label or code), group=group) for (uid, code, label, group) in g_rows
    ]

    return HomeBootstrap(
        message="Home bootstrap OK",
        surveys=surveys,
        globals=QuestionList(items=globals_list),
    )
