from pydantic import BaseModel


from backend.app.schemas.page_all import EntityEnum


class DeleteFilter(BaseModel):
    field: str
    value: int | str


class DeleteRequest(BaseModel):
    entity: EntityEnum
    filters: list[DeleteFilter]
    # si None ou [] -> DELETE de lignes
    # si liste non vide -> CLEAR des colonnes (UPDATE ... SET col = NULL)
    clear_fields: list[str] | None = None


class DeleteResponse(BaseModel):
    success: bool
    detail: str
