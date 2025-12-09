from app.api.dependencies import get_current_user
from app.db import get_db
from app.repositories.delete_repo import clear_fields, delete_rows
from app.schemas.delete import DeleteRequest, DeleteResponse
from app.schemas.user import UserPublic
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.delete("", response_model=DeleteResponse)
async def generic_delete(
    payload: DeleteRequest,
    db: AsyncSession = Depends(get_db),
    _user: UserPublic = Depends(get_current_user),
):
    """
    Endpoint générique /delete

    - Si payload.clear_fields est vide ou absent :
        => suppression de ligne(s) (DELETE)
    - Si payload.clear_fields est défini :
        => mise à NULL de certains champs (UPDATE ... SET champ = NULL)
    Exemple payload:
    {
      "entity": "commune",
      "filters": [
        {"field": "uid", "value": 123}
      ],
      "clear_fields": ["name_en"]
    }
    """
    filters = [(f.field, f.value) for f in payload.filters]

    try:
        if payload.clear_fields:
            affected = await clear_fields(
                db,
                entity=payload.entity,
                filters=filters,
                clear_fields=payload.clear_fields,
            )
            action = "Cleared fields"
        else:
            affected = await delete_rows(
                db,
                entity=payload.entity,
                filters=filters,
            )
            action = "Deleted"
    except ValueError as e:
        return {"success": False, "detail": str(e)}

    if affected == 0:
        return {"success": False, "detail": "No rows affected"}

    return {
        "success": True,
        "detail": f"{action} on {affected} row(s)",
    }
