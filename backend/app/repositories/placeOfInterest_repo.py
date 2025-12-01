from typing import List, Optional
import re
import unicodedata


from app.models.placeOfInterest import PlaceOfInterest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


def placeOfInterest_to_dict(c: PlaceOfInterest) -> dict:
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


async def list_placeOfInterest(db: AsyncSession) -> List[dict]:
    res = await db.execute(
        select(PlaceOfInterest).where(PlaceOfInterest.active == True).order_by(PlaceOfInterest.default_name.asc())
    )
    return [placeOfInterest_to_dict(c) for c in res.scalars().all()]


async def get_placeOfInterest(db: AsyncSession, code: str) -> Optional[PlaceOfInterest]:
    res = await db.execute(select(PlaceOfInterest).where(PlaceOfInterest.code == code.lower()))
    return res.scalars().first()


async def upsert_placeOfInterest(db: AsyncSession, payload: dict) -> None:
    default_name: str = payload["default_name"]
    code_raw = payload.get("code")
    code = slugify(code_raw) if code_raw else slugify(default_name)
    c = await get_placeOfInterest(db, code)
    if c is None:
        c = PlaceOfInterest(code=code, default_name=payload["default_name"])
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


async def delete_placeOfInterest(db: AsyncSession, code: str) -> bool:
    c = await get_placeOfInterest(db, code)
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
    return s or "placeOfInterest"
