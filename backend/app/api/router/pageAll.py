from app.api.dependencies import get_current_user
from app.db import get_db
from app.repositories.pageAll_repo import get_pageAll_paginated
from app.schemas.pageAll import AllResponse, EntityEnum, OrderByEnum, OrderDirEnum
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
