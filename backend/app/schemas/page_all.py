from enum import Enum


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
    answer = "answer"


class OrderByEnum(str, Enum):
    name = "name"
    code = "code"
    year = "year"
    value = "value"
    question = "question"
    commune = "commune"


class OrderDirEnum(str, Enum):
    asc = "asc"
    desc = "desc"


class PageAllLangEnum(str, Enum):
    fr = "fr"
    de = "de"
    it = "it"
    rm = "rm"
    en = "en"


class AllItem(BaseModel):
    uid: int
    code: str | None = None
    name: str
    entity: EntityEnum
    year: int | None = None
    value: str | None = None
    question_uid: int | None = None
    commune_uid: int | None = None
    question: str | None = None
    commune: str | None = None

    class Config:
        orm_mode = True


class AllPayload(BaseModel):
    items: list[AllItem]
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
    data: list[AllItem]


class FindPageData(BaseModel):
    page: int


class FindPageResponse(BaseModel):
    success: bool
    detail: str
    data: FindPageData
