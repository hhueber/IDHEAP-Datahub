from app.api.dependencies import get_current_user
from app.db import get_db
from app.repositories.placeOfInterest_repo import (
    delete_placeOfInterest,
    get_placeOfInterest,
    list_placeOfInterest,
    upsert_placeOfInterest,
)
from app.schemas.placeOfInterest import PlaceOfInterestIn
from app.schemas.user import Role, UserPublic
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


def ensure_admin(u: UserPublic):
    if u.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")


@router.get("/placeOfInterest")
async def placeOfInterest_list(db: AsyncSession = Depends(get_db), current: UserPublic = Depends(get_current_user)):
    ensure_admin(current)
    data = await list_placeOfInterest(db)
    return {"success": True, "detail": "OK", "data": data}


@router.get("/placeOfInterest/{code}")
async def placeOfInterest_get(
    code: str, db: AsyncSession = Depends(get_db), current: UserPublic = Depends(get_current_user)
):
    ensure_admin(current)
    c = await get_placeOfInterest(db, code)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PlaceOfInterest not found")
    return {
        "success": True,
        "detail": "OK",
        "data": {
            "code": c.code,
            "default_name": c.default_name,
            "name_fr": c.name_fr,
            "name_de": c.name_de,
            "name_it": c.name_it,
            "name_ro": c.name_ro,
            "name_en": c.name_en,
            "pos": list(c.pos),
        },
    }


@router.post("/placeOfInterest")
async def placeOfInterest_upsert(
    payload: PlaceOfInterestIn, db: AsyncSession = Depends(get_db), current: UserPublic = Depends(get_current_user)
):
    ensure_admin(current)
    await upsert_placeOfInterest(db, payload.model_dump())
    await db.commit()
    return {"success": True, "detail": "Saved"}


@router.delete("/placeOfInterest/{code}")
async def placeOfInterest_delete(
    code: str, db: AsyncSession = Depends(get_db), current: UserPublic = Depends(get_current_user)
):
    ensure_admin(current)
    ok = await delete_placeOfInterest(db, code)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PlaceOfInterest not found")
    await db.commit()
    return {"success": True, "detail": "Deleted"}
