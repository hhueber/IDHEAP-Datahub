from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.api.dependencies import get_current_user
from app.schemas.user import UserPublic
from app.repositories.commune_repo import suggest_communes_prefix
from app.repositories.commune_map_repo import get_commune_point

router = APIRouter()

@router.get("/suggest")
async def suggest(
    q: str = Query(..., min_length=3),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _user: UserPublic = Depends(get_current_user),
):
    data = await suggest_communes_prefix(db, q=q, limit=limit)
    return {"success": True, "detail": "OK", "data": data}

@router.get("/{uid}/point")
async def commune_point(uid: int, db: AsyncSession = Depends(get_db), _user: UserPublic = Depends(get_current_user)):
    pos = await get_commune_point(db, uid)
    if not pos:
        return {"success": False, "detail": "No geometry for this commune"}
    lat, lon = pos
    return {"success": True, "detail": "OK", "data": {"lat": lat, "lon": lon}}