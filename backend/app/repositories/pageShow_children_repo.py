from typing import Any, List, Optional, Type


from app.models.question_category_option_association import QuestionCategoryOptionAssociation
from app.models.question_global_option_association import QuestionGlobalOptionAssociation
from app.models.question_option_association import QuestionOptionAssociation
from app.repositories.pageShow_repo import ENTITY_MODEL_MAP
from app.schemas.pageAll import EntityEnum
from app.schemas.pageShow import ShowMetaChild
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


ASSOCIATION_MODEL_MAP = {
    "question_option_association": QuestionOptionAssociation,
    "question_global_option_association": QuestionGlobalOptionAssociation,
    "question_category_option_association": QuestionCategoryOptionAssociation,
}


async def get_children_paginated(
    db: AsyncSession,
    child_entity: EntityEnum,
    child_meta: ShowMetaChild,
    parent_uid: int,
    page: int,
    per_page: int,
) -> tuple[List[Any], int]:
    model: Optional[Type[Any]] = ENTITY_MODEL_MAP.get(child_entity)
    if model is None:
        return [], 0

    offset = (page - 1) * per_page

    if child_meta.relation_type == "direct":
        if not child_meta.fk_field:
            return [], 0

        fk_col = getattr(model, child_meta.fk_field, None)
        if fk_col is None:
            return [], 0

        where_clause = fk_col == parent_uid

        total_req = select(func.count()).select_from(model).where(where_clause)
        total_res = await db.execute(total_req)
        total = int(total_res.scalar() or 0)

        req = select(model).where(where_clause).offset(offset).limit(per_page)
        res = await db.execute(req)
        items = list(res.scalars().all())
        return items, total

    if child_meta.relation_type == "association":
        if (
            not child_meta.association_table
            or not child_meta.association_source_field
            or not child_meta.association_target_field
        ):
            return [], 0

        association_model = ASSOCIATION_MODEL_MAP.get(child_meta.association_table)
        if association_model is None:
            return [], 0

        source_col = getattr(association_model, child_meta.association_source_field, None)
        target_col = getattr(association_model, child_meta.association_target_field, None)
        target_uid_col = getattr(model, child_meta.target_uid_field, None)

        if source_col is None or target_col is None or target_uid_col is None:
            return [], 0

        total_req = (
            select(func.count())
            .select_from(model)
            .join(association_model, target_uid_col == target_col)
            .where(source_col == parent_uid)
        )
        total_res = await db.execute(total_req)
        total = int(total_res.scalar() or 0)

        req = (
            select(model)
            .join(association_model, target_uid_col == target_col)
            .where(source_col == parent_uid)
            .offset(offset)
            .limit(per_page)
        )
        res = await db.execute(req)
        items = list(res.scalars().all())
        return items, total

    return [], 0
