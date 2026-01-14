from app.repositories.question_repo import list_global_questions, normalize_lang
from app.repositories.survey_repo import list_surveys_uid_year
from app.schemas.questions import HomeBootstrap, QuestionItem, QuestionList, SurveyBrief
from app.services.config_service import load_effective_config
from sqlalchemy.ext.asyncio import AsyncSession


async def get_home_bootstrap(db: AsyncSession, accept_language: str | None) -> HomeBootstrap:
    lang = normalize_lang(accept_language)
    # surveys
    rows = await list_surveys_uid_year(db)
    surveys = [SurveyBrief(uid=uid, year=year) for (uid, year) in rows]

    # global questions: (uid, label, text)
    g_rows = await list_global_questions(db, lang)
    globals_list = [QuestionItem(uid=uid, label=label, text=text) for (uid, label, text) in g_rows]

    config = await load_effective_config(db)

    return HomeBootstrap(
        message="Home bootstrap OK",
        surveys=surveys,
        globals=QuestionList(items=globals_list),
        themeConfig=config,
    )
