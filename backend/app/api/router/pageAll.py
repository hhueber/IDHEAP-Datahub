from app.api.dependencies import get_current_user
from app.db import get_db
from app.repositories.pageAll_repo import get_page_for_uid, get_pageAll_paginated, suggest_pageAll_prefix
from app.schemas.pageAll import AllResponse, EntityEnum, FindPageResponse, OrderByEnum, OrderDirEnum, SuggestResponse
from app.schemas.user import UserPublic
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.get("/all", response_model=AllResponse)
async def get_all(
    entity: EntityEnum = Query(..., description="Table à interroger (commune, district, canton, ...)"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    order_by: OrderByEnum = Query(OrderByEnum.uid),
    order_dir: OrderDirEnum = Query(OrderDirEnum.asc),
    db: AsyncSession = Depends(get_db),
    _user: UserPublic = Depends(get_current_user),
):
    """
    Endpoint générique : retourne uid / code / name d'une entité donnée,
    avec pagination + tri.
    """
    items, total = await get_pageAll_paginated(
        db,
        entity=entity,
        page=page,
        per_page=per_page,
        order_by=order_by,
        order_dir=order_dir,
    )
    pages = (total + per_page - 1) // per_page

    return {
        "success": True,
        "detail": "OK",
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages,
        },
    }


@router.get("/suggest", response_model=SuggestResponse)
async def suggest(
    entity: EntityEnum = Query(...),
    q: str = Query(..., min_length=3),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _user: UserPublic = Depends(get_current_user),
):
    """
    Suggestion générique (auto-complétion) par préfixe,
    spécifique à l'entité demandée.
    """
    data = await suggest_pageAll_prefix(db, entity=entity, q=q, limit=limit)
    return {"success": True, "detail": "OK", "data": data}


@router.get("/find_page", response_model=FindPageResponse)
async def find_page(
    entity: EntityEnum,
    uid: int,
    per_page: int = 20,
    order_by: OrderByEnum = OrderByEnum.uid,
    order_dir: OrderDirEnum = OrderDirEnum.asc,
    db: AsyncSession = Depends(get_db),
    _user: UserPublic = Depends(get_current_user),
):
    """
    Renvoie la page sur laquelle se trouve un uid donné,
    en fonction du tri et du per_page.
    """
    page = await get_page_for_uid(
        db,
        entity=entity,
        uid=uid,
        order_by=order_by,
        order_dir=order_dir,
        per_page=per_page,
    )

    return {
        "success": True,
        "detail": "OK",
        "data": {"page": page},
    }
