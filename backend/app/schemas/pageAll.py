from enum import Enum
from typing import List, Optional


from pydantic import BaseModel


class EntityEnum(str, Enum):
    commune = "commune"
    district = "district"
    canton = "canton"
    question_per_survey = "question_per_survey"
    question_global = "question_global"
    question_category = "question_category"
    option = "option"
    survey = "survey"


class OrderByEnum(str, Enum):
    uid = "uid"
    code = "code"
    name = "name"


class OrderDirEnum(str, Enum):
    asc = "asc"
    desc = "desc"


class AllItem(BaseModel):
    uid: int
    code: Optional[str] = None
    name: str
    entity: EntityEnum
    year: Optional[int] = None

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


class SuggestResponse(BaseModel):
    success: bool
    detail: str
    data: List[AllItem]


class FindPageData(BaseModel):
    page: int


class FindPageResponse(BaseModel):
    success: bool
    detail: str
    data: FindPageData
