from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.api.dependencies import get_current_user
from app.schemas.user import UserPublic, Role
from app.schemas.city import CityIn
from app.repositories.city_repo import list_cities, get_city, upsert_city, delete_city

router = APIRouter()

def ensure_admin(u: UserPublic):
    if u.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")

@router.get("/cities")
async def cities_list(db: AsyncSession = Depends(get_db), current: UserPublic = Depends(get_current_user)):
    ensure_admin(current)
    data = await list_cities(db)
    return {"success": True, "detail": "OK", "data": data}

@router.get("/cities/{code}")
async def cities_get(code: str, db: AsyncSession = Depends(get_db), current: UserPublic = Depends(get_current_user)):
    ensure_admin(current)
    c = await get_city(db, code)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    return {"success": True, "detail": "OK", "data": {
        "code": c.code, "default_name": c.default_name,
        "name_fr": c.name_fr, "name_de": c.name_de, "name_it": c.name_it, "name_ro": c.name_ro, "name_en": c.name_en,
        "pos": list(c.pos)
    }}

@router.post("/cities")
async def cities_upsert(payload: CityIn, db: AsyncSession = Depends(get_db), current: UserPublic = Depends(get_current_user)):
    ensure_admin(current)
    await upsert_city(db, payload.model_dump())
    await db.commit()
    return {"success": True, "detail": "Saved"}

@router.delete("/cities/{code}")
async def cities_delete(code: str, db: AsyncSession = Depends(get_db), current: UserPublic = Depends(get_current_user)):
    ensure_admin(current)
    ok = await delete_city(db, code)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    await db.commit()
    return {"success": True, "detail": "Deleted"}