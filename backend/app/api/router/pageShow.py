from app.api.dependencies import get_current_user
from app.db import get_db
from app.repositories.pageShow_repo import get_by_uid
from app.schemas.pageAll import EntityEnum
from app.schemas.pageShow import ShowResponse
from app.schemas.user import UserPublic
from app.services.pageShow_meta import get_meta_for_entity
from app.services.pageShow_service import serialize_columns
from fastapi import APIRouter, Depends
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
