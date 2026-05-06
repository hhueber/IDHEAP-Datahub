from typing import Any, Dict, Optional


from app.repositories.pageShow_insights_repo import (
    count_answers_for_commune,
    count_answers_for_question,
    count_answers_in_canton,
    count_answers_in_district,
    count_communes_in_canton,
    count_communes_in_district,
    count_distinct_answer_values_for_question,
    count_districts_in_canton,
    count_global_questions_for_category,
    count_linked_questions_for_question_global,
    count_options_for_category,
    count_options_for_question,
    count_options_for_question_global,
    count_question_category_links_for_option,
    count_question_global_links_for_option,
    count_question_links_for_option,
    count_questions_in_survey,
    count_same_answers_for_question_year,
    count_same_value_answers_for_question_year,
    count_survey_questions_for_category,
    get_all_canton_features,
    get_all_commune_features_for_district,
    get_all_district_features_for_canton,
    get_canton_focus_feature,
    get_commune_focus_feature,
    get_district_focus_feature,
    get_survey_year_by_uid,
)
from app.schemas.pageAll import EntityEnum
from sqlalchemy.ext.asyncio import AsyncSession


def _entity_value(entity: EntityEnum | str) -> str:
    return entity.value if hasattr(entity, "value") else str(entity)


async def build_map(entity: EntityEnum | str, obj: Any, db: AsyncSession) -> Optional[Dict[str, Any]]:
    e = _entity_value(entity)

    if e == "commune":
        focus = await get_commune_focus_feature(db, obj.uid)
        if not focus:
            return None

        return {
            "type": "geo-focus",
            "level": "commune",
            "focus_feature": focus,
            "context_features": await get_all_canton_features(db),
            "child_layers": [],
        }

    if e == "district":
        focus = await get_district_focus_feature(db, obj.uid)
        if not focus:
            return None

        return {
            "type": "geo-focus",
            "level": "district",
            "focus_feature": focus,
            "context_features": await get_all_canton_features(db),
            "child_layers": await build_child_layers(entity, obj, db),
        }

    if e == "canton":
        focus = await get_canton_focus_feature(db, obj.uid)
        if not focus:
            return None

        return {
            "type": "geo-focus",
            "level": "canton",
            "focus_feature": focus,
            "context_features": await get_all_canton_features(db),
            "child_layers": await build_child_layers(entity, obj, db),
        }

    if e == "answer":
        focus = await get_commune_focus_feature(db, obj.commune_uid, obj.year)
        if not focus:
            return None

        return {
            "type": "geo-focus",
            "level": "commune",
            "focus_feature": focus,
            "context_features": await get_all_canton_features(db),
            "child_layers": [],
        }

    return None


def stat_item(key: str, value: Any) -> dict[str, Any]:
    return {
        "label_key": key,
        "value": value,
    }


async def build_stats(entity: EntityEnum | str, obj: Any, db: AsyncSession) -> Dict[str, Any]:
    e = _entity_value(entity)

    if e == "commune":
        answers_count = await count_answers_for_commune(db, obj.uid)
        return {
            "items": [
                stat_item("code", obj.code),
                stat_item("district_uid", obj.district_uid),
                stat_item("answers_count", answers_count),
            ]
        }

    if e == "district":
        communes_count = await count_communes_in_district(db, obj.uid)
        answers_count = await count_answers_in_district(db, obj.uid)
        return {
            "items": [
                stat_item("code", obj.code),
                stat_item("canton_uid", obj.canton_uid),
                stat_item("communes_count", communes_count),
                stat_item("answers_count", answers_count),
            ]
        }

    if e == "canton":
        districts_count = await count_districts_in_canton(db, obj.uid)
        communes_count = await count_communes_in_canton(db, obj.uid)
        answers_count = await count_answers_in_canton(db, obj.uid)
        return {
            "items": [
                stat_item("code", obj.code),
                stat_item("ofs_id", obj.ofs_id),
                stat_item("districts_count", districts_count),
                stat_item("communes_count", communes_count),
                stat_item("answers_count", answers_count),
            ]
        }

    if e == "survey":
        questions_count = await count_questions_in_survey(db, obj.uid)
        return {
            "items": [
                stat_item("year", obj.year),
                stat_item("questions_count", questions_count),
            ]
        }

    if e == "question_per_survey":
        survey_year = await get_survey_year_by_uid(db, obj.survey_uid)
        answers_count = await count_answers_for_question(db, obj.uid)
        options_count = await count_options_for_question(db, obj.uid)
        distinct_values = await count_distinct_answer_values_for_question(db, obj.uid)

        return {
            "items": [
                stat_item("code", obj.code),
                stat_item("survey_uid", obj.survey_uid),
                stat_item("survey_year", survey_year),
                stat_item("private", obj.private),
                stat_item("answers_count", answers_count),
                stat_item("options_count", options_count),
                stat_item("distinct_answer_values", distinct_values),
            ]
        }

    if e == "question_global":
        linked_questions = await count_linked_questions_for_question_global(db, obj.uid)
        options_count = await count_options_for_question_global(db, obj.uid)
        return {
            "items": [
                stat_item("category_uid", obj.question_category_uid),
                stat_item("linked_survey_questions", linked_questions),
                stat_item("options_count", options_count),
            ]
        }

    if e == "question_category":
        global_questions = await count_global_questions_for_category(db, obj.uid)
        survey_questions = await count_survey_questions_for_category(db, obj.uid)
        options_count = await count_options_for_category(db, obj.uid)
        return {
            "items": [
                stat_item("global_questions_count", global_questions),
                stat_item("survey_questions_count", survey_questions),
                stat_item("options_count", options_count),
            ]
        }

    if e == "option":
        linked_questions = await count_question_links_for_option(db, obj.uid)
        linked_global = await count_question_global_links_for_option(db, obj.uid)
        linked_categories = await count_question_category_links_for_option(db, obj.uid)
        return {
            "items": [
                stat_item("value", obj.value),
                stat_item("label", obj.label),
                stat_item("question_links", linked_questions),
                stat_item("global_question_links", linked_global),
                stat_item("category_links", linked_categories),
            ]
        }

    if e == "answer":
        total_same_question_year = await count_same_answers_for_question_year(db, obj.question_uid, obj.year)
        same_value_count = await count_same_value_answers_for_question_year(db, obj.question_uid, obj.year, obj.value)

        return {
            "items": [
                stat_item("year", obj.year),
                stat_item("question_uid", obj.question_uid),
                stat_item("commune_uid", obj.commune_uid),
                stat_item("value", obj.value),
                stat_item("answers_same_question_year", total_same_question_year),
                stat_item("same_value_count", same_value_count),
            ]
        }

    return {"items": []}


def _is_geo_entity(entity: str) -> bool:
    return entity in {"commune", "district", "canton"}


async def build_child_layers(entity: EntityEnum | str, obj: Any, db: AsyncSession) -> list[dict]:
    e = _entity_value(entity)

    layers: list[dict] = []

    if e == "district":
        features = await get_all_commune_features_for_district(db, obj.uid)
        if features:
            layers.append(
                {
                    "child_key": "communes",
                    "child_title": "Communes",
                    "child_entity": "commune",
                    "features": features,
                }
            )

    if e == "canton":
        features = await get_all_district_features_for_canton(db, obj.uid)
        if features:
            layers.append(
                {
                    "child_key": "districts",
                    "child_title": "Districts",
                    "child_entity": "district",
                    "features": features,
                }
            )

    return layers


async def build_insights(entity: EntityEnum | str, obj: Any, db: AsyncSession) -> Optional[Dict[str, Any]]:
    map_data = await build_map(entity, obj, db)
    stats = await build_stats(entity, obj, db)

    has_stats = bool(stats and stats.get("items"))
    if not map_data and not has_stats:
        return None

    return {
        "map": map_data,
        "stats": stats if has_stats else None,
    }
