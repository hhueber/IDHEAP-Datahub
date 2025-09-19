from app.db import get_db
from app.schemas.questions import HomeBootstrap
from app.services.home_service import get_home_bootstrap
from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.get("/bootstrap", response_model=HomeBootstrap)
async def home_bootstrap(request: Request, db: AsyncSession = Depends(get_db)):
    lang = request.headers.get("accept-language")
    return await get_home_bootstrap(db, lang)
