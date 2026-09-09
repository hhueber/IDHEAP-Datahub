from typing import Any, Optional
import json


from app.models.canton import Canton
from app.models.canton_map import CantonMap
from app.models.commune import Commune
from app.models.commune_map import CommuneMap
from app.models.district import District
from app.models.district_map import DistrictMap
from app.models.survey import Survey
from geoalchemy2 import functions as geofunc
from sqlalchemy import and_, case, func, Select, select
from sqlalchemy.ext.asyncio import AsyncSession


JoinConfig = tuple[Any, Any]


def _geojson_col(geom_col: Any) -> Any:
    return geofunc.ST_AsGeoJSON(geofunc.ST_Transform(geom_col, 4326), maxdecimaldigits=5)


async def _count_from_stmt(db: AsyncSession, stmt: Select[Any]) -> int:
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def _latest_year(db: AsyncSession, model: Any) -> Optional[int]:
    stmt = select(func.max(model.year))
    result = await db.execute(stmt)
    year = result.scalar_one_or_none()
    return int(year) if year is not None else None


async def _nearest_year(db: AsyncSession, model: Any, target_year: int, window: int = 2) -> Optional[int]:
    y = model.year
    stmt = (
        select(y)
        .where(and_(y >= target_year - window, y <= target_year + window))
        .group_by(y)
        .order_by(
            func.abs(y - target_year).asc(),
            case((y <= target_year, 0), else_=1).asc(),
            y.desc(),
        )
        .limit(1)
    )
    result = await db.execute(stmt)
    year = result.scalar_one_or_none()
    return int(year) if year is not None else None


async def get_survey_year_by_uid(db: AsyncSession, survey_uid: int) -> Optional[int]:
    stmt = select(Survey.year).where(Survey.uid == survey_uid).limit(1)
    result = await db.execute(stmt)
    year = result.scalar_one_or_none()
    return int(year) if year is not None else None


async def get_all_canton_features(db: AsyncSession) -> list[dict]:
    map_year = await _latest_year(db, CantonMap)
    if map_year is None:
        return []

    stmt = (
        select(
            Canton.uid.label("uid"),
            Canton.name.label("name"),
            Canton.code.label("code"),
            _geojson_col(CantonMap.geometry).label("geojson"),
        )
        .join(CantonMap, and_(CantonMap.canton_uid == Canton.uid, CantonMap.year == map_year))
        .order_by(Canton.uid.asc())
    )
    rows = (await db.execute(stmt)).mappings().all()

    features: list[dict] = []
    for row in rows:
        if not row["geojson"]:
            continue

        features.append(
            {
                "type": "Feature",
                "geometry": json.loads(row["geojson"]),
                "properties": {
                    "uid": row["uid"],
                    "unit_uid": row["uid"],
                    "name": row["name"],
                    "code": row["code"],
                    "level": "canton",
                },
            }
        )

    return features


async def get_commune_focus_feature(
    db: AsyncSession, commune_uid: int, target_year: Optional[int] = None
) -> Optional[dict]:
    map_year = (
        await _nearest_year(db, CommuneMap, target_year)
        if target_year is not None
        else await _latest_year(db, CommuneMap)
    )
    if map_year is None:
        return None

    stmt = (
        select(
            Commune.uid.label("uid"),
            Commune.name.label("name"),
            Commune.code.label("code"),
            Commune.district_uid.label("district_uid"),
            _geojson_col(CommuneMap.geometry).label("geojson"),
        )
        .join(CommuneMap, and_(CommuneMap.commune_uid == Commune.uid, CommuneMap.year == map_year))
        .where(Commune.uid == commune_uid)
        .limit(1)
    )
    row = (await db.execute(stmt)).mappings().first()
    if not row or not row["geojson"]:
        return None

    return {
        "type": "Feature",
        "geometry": json.loads(row["geojson"]),
        "properties": {
            "uid": row["uid"],
            "unit_uid": row["uid"],
            "name": row["name"],
            "code": row["code"],
            "level": "commune",
            "district_uid": row["district_uid"],
        },
    }


async def get_district_focus_feature(db: AsyncSession, district_uid: int) -> Optional[dict]:
    map_year = await _latest_year(db, DistrictMap)
    if map_year is None:
        return None

    stmt = (
        select(
            District.uid.label("uid"),
            District.name.label("name"),
            District.code.label("code"),
            District.canton_uid.label("canton_uid"),
            _geojson_col(DistrictMap.geometry).label("geojson"),
        )
        .join(DistrictMap, and_(DistrictMap.district_id == District.uid, DistrictMap.year == map_year))
        .where(District.uid == district_uid)
        .limit(1)
    )
    row = (await db.execute(stmt)).mappings().first()
    if not row or not row["geojson"]:
        return None

    return {
        "type": "Feature",
        "geometry": json.loads(row["geojson"]),
        "properties": {
            "uid": row["uid"],
            "unit_uid": row["uid"],
            "name": row["name"],
            "code": row["code"],
            "level": "district",
            "canton_uid": row["canton_uid"],
        },
    }


async def get_canton_focus_feature(db: AsyncSession, canton_uid: int) -> Optional[dict]:
    map_year = await _latest_year(db, CantonMap)
    if map_year is None:
        return None

    stmt = (
        select(
            Canton.uid.label("uid"),
            Canton.name.label("name"),
            Canton.code.label("code"),
            _geojson_col(CantonMap.geometry).label("geojson"),
        )
        .join(CantonMap, and_(CantonMap.canton_uid == Canton.uid, CantonMap.year == map_year))
        .where(Canton.uid == canton_uid)
        .limit(1)
    )
    row = (await db.execute(stmt)).mappings().first()
    if not row or not row["geojson"]:
        return None

    return {
        "type": "Feature",
        "geometry": json.loads(row["geojson"]),
        "properties": {
            "uid": row["uid"],
            "unit_uid": row["uid"],
            "name": row["name"],
            "code": row["code"],
            "level": "canton",
        },
    }


async def count_by_column(
    db: AsyncSession,
    model: Any,
    column: Any,
    value: Any,
) -> int:
    stmt = select(func.count()).select_from(model).where(column == value)
    return await _count_from_stmt(db, stmt)


async def count_by_columns(
    db: AsyncSession,
    model: Any,
    filters: tuple[tuple[Any, Any], ...],
) -> int:
    stmt = select(func.count()).select_from(model)

    for column, value in filters:
        stmt = stmt.where(column == value)

    return await _count_from_stmt(db, stmt)


async def count_distinct_by_column(
    db: AsyncSession,
    model: Any,
    distinct_column: Any,
    filter_column: Any,
    filter_value: Any,
) -> int:
    stmt = select(func.count(func.distinct(distinct_column))).select_from(model).where(filter_column == filter_value)
    return await _count_from_stmt(db, stmt)


async def count_with_joins(
    db: AsyncSession,
    model: Any,
    joins: tuple[JoinConfig, ...],
    filter_column: Any,
    filter_value: Any,
) -> int:
    stmt = select(func.count()).select_from(model)

    for join_model, join_condition in joins:
        stmt = stmt.join(join_model, join_condition)

    stmt = stmt.where(filter_column == filter_value)

    return await _count_from_stmt(db, stmt)


async def _get_child_features_for_parent(
    db: AsyncSession,
    *,
    child_model: Any,
    map_model: Any,
    map_fk_column: Any,
    child_uid_column: Any,
    parent_fk_column: Any,
    parent_uid: int,
    level: str,
) -> list[dict]:
    map_year = await _latest_year(db, map_model)
    if map_year is None:
        return []

    stmt = (
        select(
            child_model.uid.label("uid"),
            child_model.name.label("name"),
            child_model.code.label("code"),
            _geojson_col(map_model.geometry).label("geojson"),
        )
        .join(
            map_model,
            and_(
                map_fk_column == child_uid_column,
                map_model.year == map_year,
            ),
        )
        .where(parent_fk_column == parent_uid)
        .order_by(child_model.uid.asc())
    )

    rows = (await db.execute(stmt)).mappings().all()

    features: list[dict] = []
    for row in rows:
        if not row["geojson"]:
            continue

        features.append(
            {
                "type": "Feature",
                "geometry": json.loads(row["geojson"]),
                "properties": {
                    "uid": row["uid"],
                    "unit_uid": row["uid"],
                    "name": row["name"],
                    "code": row["code"],
                    "entity": level,
                    "level": level,
                },
            }
        )

    return features


async def get_all_commune_features_for_district(
    db: AsyncSession,
    district_uid: int,
) -> list[dict]:
    return await _get_child_features_for_parent(
        db,
        child_model=Commune,
        map_model=CommuneMap,
        map_fk_column=CommuneMap.commune_uid,
        child_uid_column=Commune.uid,
        parent_fk_column=Commune.district_uid,
        parent_uid=district_uid,
        level="commune",
    )


async def get_all_district_features_for_canton(
    db: AsyncSession,
    canton_uid: int,
) -> list[dict]:
    return await _get_child_features_for_parent(
        db,
        child_model=District,
        map_model=DistrictMap,
        map_fk_column=DistrictMap.district_id,
        child_uid_column=District.uid,
        parent_fk_column=District.canton_uid,
        parent_uid=canton_uid,
        level="district",
    )
