from typing import Literal, Optional
import unicodedata


from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.repositories.commune_map_repo import get_commune_point
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession


GeoType = Literal["commune", "district", "canton"]


def normalize_search_text(value: Optional[str]) -> str:
    if not value:
        return ""

    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    return value.lower().strip()


def geo_row_to_dict(row, geo_type: GeoType) -> dict:
    return {
        "uid": row.uid,
        "type": geo_type,
        "code": row.code,
        "name": row.name,
        "name_fr": row.name_fr,
        "name_de": row.name_de,
        "name_it": row.name_it,
        "name_ro": row.name_ro,
        "name_en": row.name_en,
    }


def score_geo_suggestion(item: dict, q: str) -> tuple[int, int, str]:
    q_norm = normalize_search_text(q)

    fields = [
        item.get("name"),
        item.get("name_fr"),
        item.get("name_de"),
        item.get("name_it"),
        item.get("name_ro"),
        item.get("name_en"),
        item.get("code"),
    ]

    normalized_fields = [normalize_search_text(v) for v in fields if v]

    if any(v == q_norm for v in normalized_fields):
        match_rank = 0
    elif any(v.startswith(q_norm) for v in normalized_fields):
        match_rank = 1
    elif any(q_norm in v for v in normalized_fields):
        match_rank = 2
    else:
        match_rank = 9

    type_rank = {
        "commune": 0,
        "district": 1,
        "canton": 2,
    }.get(item["type"], 9)

    return match_rank, type_rank, normalize_search_text(item.get("name"))


async def suggest_geo_locations(
    db: AsyncSession,
    q: str,
    limit: int = 20,
) -> list[dict]:
    q = q.strip()

    if len(q) < 3:
        return []

    u = func.unaccent
    l = func.lower
    q_like = f"%{q.lower()}%"

    def where_match(model):
        return or_(
            l(u(model.name)).like(q_like),
            l(u(model.name_fr)).like(q_like),
            l(u(model.name_de)).like(q_like),
            l(u(model.name_it)).like(q_like),
            l(u(model.name_ro)).like(q_like),
            l(u(model.name_en)).like(q_like),
            l(u(model.code)).like(q_like),
        )

    commune_stmt = (
        select(
            Commune.uid,
            Commune.code,
            Commune.name,
            Commune.name_fr,
            Commune.name_de,
            Commune.name_it,
            Commune.name_ro,
            Commune.name_en,
        )
        .where(where_match(Commune))
        .limit(limit)
    )

    district_stmt = (
        select(
            District.uid,
            District.code,
            District.name,
            District.name_fr,
            District.name_de,
            District.name_it,
            District.name_ro,
            District.name_en,
        )
        .where(where_match(District))
        .limit(limit)
    )

    canton_stmt = (
        select(
            Canton.uid,
            Canton.code,
            Canton.name,
            Canton.name_fr,
            Canton.name_de,
            Canton.name_it,
            Canton.name_ro,
            Canton.name_en,
        )
        .where(where_match(Canton))
        .limit(limit)
    )

    commune_rows = (await db.execute(commune_stmt)).mappings().all()
    district_rows = (await db.execute(district_stmt)).mappings().all()
    canton_rows = (await db.execute(canton_stmt)).mappings().all()

    suggestions: list[dict] = []

    suggestions.extend(geo_row_to_dict(row, "commune") for row in commune_rows)
    suggestions.extend(geo_row_to_dict(row, "district") for row in district_rows)
    suggestions.extend(geo_row_to_dict(row, "canton") for row in canton_rows)

    suggestions.sort(key=lambda item: score_geo_suggestion(item, q))

    return suggestions[:limit]


async def get_geo_point(
    db: AsyncSession,
    geo_type: GeoType,
    uid: int,
) -> Optional[tuple[float, float]]:
    if geo_type == "commune":
        return await get_commune_point(db, uid)

    if geo_type == "district":
        stmt = select(Commune.uid).where(Commune.district_uid == uid)
    elif geo_type == "canton":
        stmt = (
            select(Commune.uid).join(District, Commune.district_uid == District.uid).where(District.canton_uid == uid)
        )
    else:
        return None

    res = await db.execute(stmt)
    commune_uids = list(res.scalars().all())

    points: list[tuple[float, float]] = []

    for commune_uid in commune_uids:
        point = await get_commune_point(db, commune_uid)
        if point:
            points.append(point)

    if not points:
        return None

    lat = sum(point[0] for point in points) / len(points)
    lon = sum(point[1] for point in points) / len(points)

    return lat, lon
