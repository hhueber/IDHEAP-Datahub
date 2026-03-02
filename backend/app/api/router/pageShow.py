from app.api.dependencies import get_current_user
from app.db import get_db
from app.repositories.pageShow_children_repo import get_children_paginated
from app.repositories.pageShow_repo import get_by_uid
from app.schemas.pageAll import EntityEnum
from app.schemas.pageShow import ShowChildrenResponse, ShowResponse
from app.schemas.user import UserPublic
from app.services.pageShow_meta import get_meta_for_entity
from app.services.pageShow_service import serialize_columns
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.get("/{entity}/{uid}", response_model=ShowResponse)
async def show_entity(
    entity: EntityEnum,
    uid: int,
    db: AsyncSession = Depends(get_db),
    _user: UserPublic = Depends(get_current_user),
):
    meta = get_meta_for_entity(entity.value)
    obj = await get_by_uid(db, entity=entity, uid=uid)

    if obj is None:
        return {"success": True, "detail": "None", "meta": meta, "data": None}

    exclude = set(meta.hide_keys) if meta else {"uid"}
    data = serialize_columns(obj, exclude=exclude)

    return {"success": True, "detail": "OK", "meta": meta, "data": data}


@router.get("/{entity}/{uid}/children/{child_key}", response_model=ShowChildrenResponse)
async def show_children(
    entity: EntityEnum,
    uid: int,
    child_key: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: UserPublic = Depends(get_current_user),
):
    meta = get_meta_for_entity(entity.value)
    if not meta or not meta.children:
        return {
            "success": True,
            "detail": "No children",
            "data": {"items": [], "total": 0, "page": page, "per_page": per_page, "pages": 0},
        }

    child = next((c for c in meta.children if c.key == child_key), None)
    if not child:
        return {"success": False, "detail": f"Unknown child_key: {child_key}", "data": None}

    child_entity = EntityEnum(child.entity)  # ex: "district"
    items, total = await get_children_paginated(
        db,
        child_entity=child_entity,
        fk_field=child.fk_field,
        parent_uid=uid,
        page=page,
        per_page=per_page,
    )
    pages = (total + per_page - 1) // per_page if total else 0

    # on sérialise les colonnes
    serialized = [serialize_columns(x, exclude=set()) for x in items]

    return {
        "success": True,
        "detail": "OK",
        "data": {
            "items": serialized,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages,
        },
    }
