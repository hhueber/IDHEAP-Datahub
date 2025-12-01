from enum import Enum
from typing import List


from pydantic import BaseModel


class EntityEnum(str, Enum):
    commune = "commune"
    district = "district"
    canton = "canton"
    # Rajouter ici des tables plus tard


class OrderByEnum(str, Enum):
    uid = "uid"
    code = "code"
    name = "name"


class OrderDirEnum(str, Enum):
    asc = "asc"
    desc = "desc"


class AllItem(BaseModel):
    uid: int
    code: str
    name: str
    entity: EntityEnum

    class Config:
        orm_mode = True


class AllPayload(BaseModel):
    items: List[AllItem]
    total: int
    page: int
    per_page: int
    pages: int


class AllResponse(BaseModel):
    success: bool
    detail: str
    data: AllPayload
