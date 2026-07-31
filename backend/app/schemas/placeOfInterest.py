from typing import List, Literal, Optional, Tuple


from pydantic import BaseModel, Field, field_validator


GeoSuggestionType = Literal["commune", "district", "canton"]


class PlaceOfInterestBase(BaseModel):
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
    def normalize_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip().lower()
        if not v:
            raise ValueError("empty code")
        return v

    @field_validator("pos")
    @classmethod
    def check_pos(cls, p: Tuple[float, float]) -> Tuple[float, float]:
        lat, lon = p
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError("invalid lat/lon")
        return (float(lat), float(lon))


class PlaceOfInterestClientOut(BaseModel):
    code: str
    name: str
    pos: Tuple[float, float]


class PlaceOfInterestIn(PlaceOfInterestBase):
    pass


class PlaceOfInterestOut(PlaceOfInterestBase):
    pass


class GeoSuggestionOut(BaseModel):
    """
    Suggestion géographique complète.

    Utilisée pour les recherches privées et publiques.
    Peut représenter une commune, un district ou un canton.
    """

    uid: int
    type: GeoSuggestionType
    code: str
    name: str
    name_fr: Optional[str] = None
    name_de: Optional[str] = None
    name_it: Optional[str] = None
    name_ro: Optional[str] = None
    name_en: Optional[str] = None


class GeoSuggestionResponse(BaseModel):
    """
    Réponse standardisée pour la recherche géographique.
    """

    success: bool
    detail: str
    data: List[GeoSuggestionOut]


class GeoPointOut(BaseModel):
    """
    Point géographique représentatif d'une entité.
    """

    lat: float
    lon: float


class GeoPointResponse(BaseModel):
    """
    Réponse standardisée pour la récupération d'un point géographique.
    """

    success: bool
    detail: str
    data: Optional[GeoPointOut] = None


class PlaceOfInterestSuggestOut(BaseModel):
    """
    Schéma pour la suggestion publique utilisée par la carte.

    Contrairement à l'ancienne version, cette suggestion peut maintenant venir :
    - d'une commune
    - d'un district
    - d'un canton
    """

    uid: int
    type: GeoSuggestionType
    code: str
    default_name: str
    pos: Tuple[float, float] = Field(..., description="[lat, lon]")


class PlaceOfInterestSuggestResponse(BaseModel):
    """
    Réponse standardisée pour la route publique de suggestion.
    """

    success: bool
    detail: str
    data: List[PlaceOfInterestSuggestOut]
