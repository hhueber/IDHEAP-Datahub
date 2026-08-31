from app.api.permissions import require_permission
from app.config.roles import PermissionLevel, PermissionScope
from app.db import get_db
from app.repositories.edit_repo import update_rows
from app.schemas.edit import EditRequest, EditResponse
from app.security.edit_guard import assert_edit_allowed, EditAction
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.patch("", response_model=EditResponse)
async def generic_edit(
    payload: EditRequest,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(require_permission(PermissionScope.DATASET, PermissionLevel.WRITE)),
):
    """
    Endpoint générique /edit

    Exemple payload:
    {
      "entity": "question_per_survey",
      "filters": [{"field": "uid", "value": 123}],
      "updates": {"name_en": "New name"}
    }

    - updates: un ou plusieurs champs
    - filtre: peut matcher une ou plusieurs lignes
    - interdit: valeur vide (string)
    """
    filters = [(f.field, f.value) for f in payload.filters]

    try:
        assert_edit_allowed(entity=payload.entity, action=EditAction.UPDATE_ROWS)

        affected = await update_rows(
            db,
            entity=payload.entity,
            filters=filters,
            updates=payload.updates,
        )
    except ValueError as e:
        return {"success": False, "detail": str(e)}

    if affected == 0:
        return {"success": False, "detail": "No rows affected"}

    return {"success": True, "detail": f"Updated {affected} row(s)"}
