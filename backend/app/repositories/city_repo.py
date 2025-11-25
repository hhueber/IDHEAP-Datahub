from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.city import City
import re
import unicodedata

def city_to_dict(c: City) -> dict:
    return {
        "code": c.code,
        "default_name": c.default_name,
        "name_fr": c.name_fr,
        "name_de": c.name_de,
        "name_it": c.name_it,
        "name_ro": c.name_ro,
        "name_en": c.name_en,
        "pos": list(c.pos),
    }

async def list_cities(db: AsyncSession) -> List[dict]:
    res = await db.execute(select(City).where(City.active == True).order_by(City.default_name.asc()))
    return [city_to_dict(c) for c in res.scalars().all()]

async def get_city(db: AsyncSession, code: str) -> Optional[City]:
    res = await db.execute(select(City).where(City.code == code.lower()))
    return res.scalars().first()

async def upsert_city(db: AsyncSession, payload: dict) -> None:
    default_name: str = payload["default_name"]
    code_raw = payload.get("code")
    code = slugify(code_raw) if code_raw else slugify(default_name)
    c = await get_city(db, code)
    if c is None:
        c = City(code=code, default_name=payload["default_name"])
        c.set_pos(payload["pos"][0], payload["pos"][1])
        c.name_fr = payload.get("name_fr")
        c.name_de = payload.get("name_de")
        c.name_it = payload.get("name_it")
        c.name_ro = payload.get("name_ro")
        c.name_en = payload.get("name_en")
        c.active = True
        db.add(c)
    else:
        c.default_name = payload["default_name"]
        c.name_fr = payload.get("name_fr")
        c.name_de = payload.get("name_de")
        c.name_it = payload.get("name_it")
        c.name_ro = payload.get("name_ro")
        c.name_en = payload.get("name_en")
        c.set_pos(payload["pos"][0], payload["pos"][1])
        c.active = True

async def delete_city(db: AsyncSession, code: str) -> bool:
    c = await get_city(db, code)
    if not c:
        return False
    await db.delete(c)
    return True

def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "city"
