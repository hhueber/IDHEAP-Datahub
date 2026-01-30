from typing import Dict, List, Union


from app.schemas.pageAll import EntityEnum
from pydantic import BaseModel, Field, field_validator


EditValue = Union[str, int, float, bool]


class EditFilter(BaseModel):
    field: str
    value: Union[int, str]


class EditRequest(BaseModel):
    entity: EntityEnum
    filters: List[EditFilter]
    # field -> value (non vide pour les strings)
    updates: Dict[str, EditValue] = Field(default_factory=dict)

    @field_validator("updates")
    @classmethod
    def validate_updates_not_empty(cls, v: Dict[str, EditValue]):
        if not v:
            raise ValueError("No updates provided")
        # interdiction d'envoyer des strings vides / whitespace
        for k, val in v.items():
            if isinstance(val, str) and val.strip() == "":
                raise ValueError(f"Empty string is not allowed for field: {k}")
        return v


class EditResponse(BaseModel):
    success: bool
    detail: str
