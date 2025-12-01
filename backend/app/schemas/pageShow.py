from typing import Optional


from pydantic import BaseModel


class CantonItem(BaseModel):
    uid: int
    code: str
    name: str
    ofs_id: int
    name_de: Optional[str]
    name_fr: Optional[str]
    name_en: Optional[str]
    name_ro: Optional[str]
    name_it: Optional[str]

    class Config:
        orm_mode = True


class CommuneItem(BaseModel):
    uid: int
    code: str
    name: str
    name_de: Optional[str]
    name_fr: Optional[str]
    name_en: Optional[str]
    name_ro: Optional[str]
    name_it: Optional[str]

    class Config:
        orm_mode = True


class DistrictItem(BaseModel):
    uid: int
    code: str
    name: str
    name_de: Optional[str]
    name_fr: Optional[str]
    name_en: Optional[str]
    name_ro: Optional[str]
    name_it: Optional[str]

    class Config:
        orm_mode = True


class CantonResponse(BaseModel):
    success: bool
    detail: str
    data: Optional[CantonItem]


class DistrictResponse(BaseModel):
    success: bool
    detail: str
    data: Optional[DistrictItem]


class CommuneResponse(BaseModel):
    success: bool
    detail: str
    data: Optional[CommuneItem]
