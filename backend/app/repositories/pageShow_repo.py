from typing import Any, Dict, Optional, Type


from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.models.option import Option
from app.models.question_category import QuestionCategory
from app.models.question_global import QuestionGlobal
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from app.schemas.pageAll import EntityEnum
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


ENTITY_MODEL_MAP: Dict[EntityEnum, Type[Any]] = {
    EntityEnum.commune: Commune,
    EntityEnum.district: District,
    EntityEnum.canton: Canton,
    EntityEnum.survey: Survey,
    EntityEnum.question_per_survey: QuestionPerSurvey,
    EntityEnum.question_global: QuestionGlobal,
    EntityEnum.question_category: QuestionCategory,
    EntityEnum.option: Option,
}


async def get_by_uid(db: AsyncSession, entity: EntityEnum, uid: int) -> Optional[Any]:
    model = ENTITY_MODEL_MAP.get(entity)
    if model is None:
        return None

    req = select(model).where(model.uid == uid)
    res = await db.execute(req)
    return res.scalar_one_or_none()
