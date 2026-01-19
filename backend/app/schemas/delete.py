from typing import List, Optional, Union


from app.schemas.pageAll import EntityEnum
from pydantic import BaseModel


class DeleteFilter(BaseModel):
    field: str
    value: Union[int, str]


class DeleteRequest(BaseModel):
    entity: EntityEnum
    filters: List[DeleteFilter]
    # si None ou [] -> DELETE de lignes
    # si liste non vide -> CLEAR des colonnes (UPDATE ... SET col = NULL)
    clear_fields: Optional[List[str]] = None


class DeleteResponse(BaseModel):
    success: bool
    detail: str
