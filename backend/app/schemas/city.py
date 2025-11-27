"""Pydantic schemas exposed by the API.

Conventions:
- Precise types (Optional, List, Dict, etc.)
"""

from typing import List, Optional, Tuple


from pydantic import BaseModel, Field, field_validator


class CityBase(BaseModel):
    code: Optional[str] = None
    default_name: str
    name_fr: Optional[str] = None
    name_de: Optional[str] = None
    name_it: Optional[str] = None
    name_ro: Optional[str] = None
    name_en: Optional[str] = None
    pos: Tuple[float, float] = Field(..., description="[lat, lon]")

    @field_validator("code")
    @classmethod
    def normalize_code(cls, v: str):
        v = v.strip().lower()
        if not v:
            raise ValueError("empty code")
        return v

    @field_validator("pos")
    @classmethod
    def check_pos(cls, p):
        lat, lon = p
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError("invalid lat/lon")
        return (float(lat), float(lon))


class CityClientOut(BaseModel):
    code: str
    name: str
    pos: Tuple[float, float]


class CityIn(CityBase):
    pass


class CityOut(CityBase):
    pass


class CitySuggestOut(BaseModel):
    """
    Schéma pour la suggest publique :
    - default_name : nom de la commune
    - pos          : [lat, lon]
    """

    default_name: str
    pos: Tuple[float, float] = Field(..., description="[lat, lon]")


class CitySuggestResponse(BaseModel):
    """
    Réponse standardisée pour la route publique de suggest.
    """

    success: bool
    detail: str
    data: List[CitySuggestOut]
