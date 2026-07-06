from typing import Any, Dict, Optional


from app.models.answer import Answer
from app.models.commune import Commune
from app.models.district import District
from app.models.question_category_option_association import QuestionCategoryOptionAssociation
from app.models.question_global import QuestionGlobal
from app.models.question_global_option_association import QuestionGlobalOptionAssociation
from app.models.question_option_association import QuestionOptionAssociation
from app.models.question_per_survey import QuestionPerSurvey
from app.repositories.pageShow_insights_repo import (
    count_by_column,
    count_by_columns,
    count_distinct_by_column,
    count_with_joins,
    get_all_canton_features,
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
        answers_count = await count_by_column(
            db,
            Answer,
            Answer.commune_uid,
            obj.uid,
        )

        return {
            "items": [
                stat_item("code", obj.code),
                stat_item("district_uid", obj.district_uid),
                stat_item("answers_count", answers_count),
            ]
        }

    if e == "district":
        communes_count = await count_by_column(
            db,
            Commune,
            Commune.district_uid,
            obj.uid,
        )

        answers_count = await count_with_joins(
            db,
            Answer,
            joins=((Commune, Commune.uid == Answer.commune_uid),),
            filter_column=Commune.district_uid,
            filter_value=obj.uid,
        )

        return {
            "items": [
                stat_item("code", obj.code),
                stat_item("canton_uid", obj.canton_uid),
                stat_item("communes_count", communes_count),
                stat_item("answers_count", answers_count),
            ]
        }

    if e == "canton":
        districts_count = await count_by_column(
            db,
            District,
            District.canton_uid,
            obj.uid,
        )

        communes_count = await count_with_joins(
            db,
            Commune,
            joins=((District, District.uid == Commune.district_uid),),
            filter_column=District.canton_uid,
            filter_value=obj.uid,
        )

        answers_count = await count_with_joins(
            db,
            Answer,
            joins=(
                (Commune, Commune.uid == Answer.commune_uid),
                (District, District.uid == Commune.district_uid),
            ),
            filter_column=District.canton_uid,
            filter_value=obj.uid,
        )

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
        questions_count = await count_by_column(
            db,
            QuestionPerSurvey,
            QuestionPerSurvey.survey_uid,
            obj.uid,
        )

        return {
            "items": [
                stat_item("year", obj.year),
                stat_item("questions_count", questions_count),
            ]
        }

    if e == "question_per_survey":
        survey_year = await get_survey_year_by_uid(db, obj.survey_uid)

        answers_count = await count_by_column(
            db,
            Answer,
            Answer.question_uid,
            obj.uid,
        )

        options_count = await count_by_column(
            db,
            QuestionOptionAssociation,
            QuestionOptionAssociation.question_uid,
            obj.uid,
        )

        distinct_values = await count_distinct_by_column(
            db,
            Answer,
            Answer.value,
            Answer.question_uid,
            obj.uid,
        )

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
        linked_questions = await count_by_column(
            db,
            QuestionPerSurvey,
            QuestionPerSurvey.question_global_uid,
            obj.uid,
        )

        options_count = await count_by_column(
            db,
            QuestionGlobalOptionAssociation,
            QuestionGlobalOptionAssociation.question_uid,
            obj.uid,
        )

        return {
            "items": [
                stat_item("category_uid", obj.question_category_uid),
                stat_item("linked_survey_questions", linked_questions),
                stat_item("options_count", options_count),
            ]
        }

    if e == "question_category":
        global_questions = await count_by_column(
            db,
            QuestionGlobal,
            QuestionGlobal.question_category_uid,
            obj.uid,
        )

        survey_questions = await count_by_column(
            db,
            QuestionPerSurvey,
            QuestionPerSurvey.question_category_uid,
            obj.uid,
        )

        options_count = await count_by_column(
            db,
            QuestionCategoryOptionAssociation,
            QuestionCategoryOptionAssociation.question_uid,
            obj.uid,
        )

        return {
            "items": [
                stat_item("global_questions_count", global_questions),
                stat_item("survey_questions_count", survey_questions),
                stat_item("options_count", options_count),
            ]
        }

    if e == "option":
        linked_questions = await count_by_column(
            db,
            QuestionOptionAssociation,
            QuestionOptionAssociation.option_uid,
            obj.uid,
        )

        linked_global = await count_by_column(
            db,
            QuestionGlobalOptionAssociation,
            QuestionGlobalOptionAssociation.option_uid,
            obj.uid,
        )

        linked_categories = await count_by_column(
            db,
            QuestionCategoryOptionAssociation,
            QuestionCategoryOptionAssociation.option_uid,
            obj.uid,
        )

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
        total_same_question_year = await count_by_columns(
            db,
            Answer,
            filters=(
                (Answer.question_uid, obj.question_uid),
                (Answer.year, obj.year),
            ),
        )

        same_value_count = await count_by_columns(
            db,
            Answer,
            filters=(
                (Answer.question_uid, obj.question_uid),
                (Answer.year, obj.year),
                (Answer.value, obj.value),
            ),
        )

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
