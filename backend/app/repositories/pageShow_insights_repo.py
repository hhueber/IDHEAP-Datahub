from typing import Any, Optional
import json


from app.models.answer import Answer
from app.models.canton import Canton
from app.models.canton_map import CantonMap
from app.models.commune import Commune
from app.models.commune_map import CommuneMap
from app.models.district import District
from app.models.district_map import DistrictMap
from app.models.option import Option
from app.models.question_category import QuestionCategory
from app.models.question_category_option_association import QuestionCategoryOptionAssociation
from app.models.question_global import QuestionGlobal
from app.models.question_global_option_association import QuestionGlobalOptionAssociation
from app.models.question_option_association import QuestionOptionAssociation
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from geoalchemy2 import functions as geofunc
from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession


def _geojson_col(geom_col: Any) -> Any:
    return geofunc.ST_AsGeoJSON(geofunc.ST_Transform(geom_col, 4326), maxdecimaldigits=5)


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


async def count_answers_for_commune(db: AsyncSession, commune_uid: int) -> int:
    stmt = select(func.count()).select_from(Answer).where(Answer.commune_uid == commune_uid)
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_communes_in_district(db: AsyncSession, district_uid: int) -> int:
    stmt = select(func.count()).select_from(Commune).where(Commune.district_uid == district_uid)
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_answers_in_district(db: AsyncSession, district_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(Answer)
        .join(Commune, Commune.uid == Answer.commune_uid)
        .where(Commune.district_uid == district_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_districts_in_canton(db: AsyncSession, canton_uid: int) -> int:
    stmt = select(func.count()).select_from(District).where(District.canton_uid == canton_uid)
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_communes_in_canton(db: AsyncSession, canton_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(Commune)
        .join(District, District.uid == Commune.district_uid)
        .where(District.canton_uid == canton_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_answers_in_canton(db: AsyncSession, canton_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(Answer)
        .join(Commune, Commune.uid == Answer.commune_uid)
        .join(District, District.uid == Commune.district_uid)
        .where(District.canton_uid == canton_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_questions_in_survey(db: AsyncSession, survey_uid: int) -> int:
    stmt = select(func.count()).select_from(QuestionPerSurvey).where(QuestionPerSurvey.survey_uid == survey_uid)
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_answers_for_question(db: AsyncSession, question_uid: int) -> int:
    stmt = select(func.count()).select_from(Answer).where(Answer.question_uid == question_uid)
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_distinct_answer_values_for_question(db: AsyncSession, question_uid: int) -> int:
    stmt = (
        select(func.count(func.distinct(Answer.value))).select_from(Answer).where(Answer.question_uid == question_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_options_for_question(db: AsyncSession, question_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(QuestionOptionAssociation)
        .where(QuestionOptionAssociation.question_uid == question_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_linked_questions_for_question_global(db: AsyncSession, question_global_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(QuestionPerSurvey)
        .where(QuestionPerSurvey.question_global_uid == question_global_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_options_for_question_global(db: AsyncSession, question_global_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(QuestionGlobalOptionAssociation)
        .where(QuestionGlobalOptionAssociation.question_uid == question_global_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_global_questions_for_category(db: AsyncSession, category_uid: int) -> int:
    stmt = select(func.count()).select_from(QuestionGlobal).where(QuestionGlobal.question_category_uid == category_uid)
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_survey_questions_for_category(db: AsyncSession, category_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(QuestionPerSurvey)
        .where(QuestionPerSurvey.question_category_uid == category_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_options_for_category(db: AsyncSession, category_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(QuestionCategoryOptionAssociation)
        .where(QuestionCategoryOptionAssociation.question_uid == category_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_question_links_for_option(db: AsyncSession, option_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(QuestionOptionAssociation)
        .where(QuestionOptionAssociation.option_uid == option_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_question_global_links_for_option(db: AsyncSession, option_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(QuestionGlobalOptionAssociation)
        .where(QuestionGlobalOptionAssociation.option_uid == option_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_question_category_links_for_option(db: AsyncSession, option_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(QuestionCategoryOptionAssociation)
        .where(QuestionCategoryOptionAssociation.option_uid == option_uid)
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_same_answers_for_question_year(db: AsyncSession, question_uid: int, year: int) -> int:
    stmt = select(func.count()).select_from(Answer).where(Answer.question_uid == question_uid, Answer.year == year)
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def count_same_value_answers_for_question_year(
    db: AsyncSession, question_uid: int, year: int, value: Optional[str]
) -> int:
    stmt = (
        select(func.count())
        .select_from(Answer)
        .where(
            Answer.question_uid == question_uid,
            Answer.year == year,
            Answer.value == value,
        )
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


async def get_all_commune_features_for_district(db: AsyncSession, district_uid: int) -> list[dict]:
    map_year = await _latest_year(db, CommuneMap)
    if map_year is None:
        return []

    stmt = (
        select(
            Commune.uid.label("uid"),
            Commune.name.label("name"),
            Commune.code.label("code"),
            _geojson_col(CommuneMap.geometry).label("geojson"),
        )
        .join(
            CommuneMap,
            and_(CommuneMap.commune_uid == Commune.uid, CommuneMap.year == map_year),
        )
        .where(Commune.district_uid == district_uid)
        .order_by(Commune.uid.asc())
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
                    "name": row["name"],
                    "code": row["code"],
                    "entity": "commune",
                    "level": "commune",
                },
            }
        )

    return features


async def get_all_district_features_for_canton(db: AsyncSession, canton_uid: int) -> list[dict]:
    map_year = await _latest_year(db, DistrictMap)
    if map_year is None:
        return []

    stmt = (
        select(
            District.uid.label("uid"),
            District.name.label("name"),
            District.code.label("code"),
            _geojson_col(DistrictMap.geometry).label("geojson"),
        )
        .join(
            DistrictMap,
            and_(DistrictMap.district_id == District.uid, DistrictMap.year == map_year),
        )
        .where(District.canton_uid == canton_uid)
        .order_by(District.uid.asc())
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
                    "name": row["name"],
                    "code": row["code"],
                    "entity": "district",
                    "level": "district",
                },
            }
        )

    return features
