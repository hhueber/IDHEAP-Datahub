from app.db import get_db
from app.schemas.questions import QuestionList
from app.services.question_service import get_questions_by_survey
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.get("", response_model=QuestionList)
async def list_questions(
    scope: str = Query(..., pattern="^(per_survey|global)$"),
    survey_uid: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    accept_language: str | None = Header(None, alias="Accept-Language"),
):
    """List the questions according to the requested scope."""
    if scope == "per_survey":
        if survey_uid is None:
            raise HTTPException(status_code=400, detail="survey_uid is required for scope=per_survey")
        return await get_questions_by_survey(db, survey_uid, accept_language)
    # scope=global est géré par /home/bootstrap pour éviter un 2eme call initial
    raise HTTPException(status_code=400, detail="scope=global: use /home/bootstrap")
