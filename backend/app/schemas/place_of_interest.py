from typing import Literal


from pydantic import BaseModel, Field, field_validator


GeoSuggestionType = Literal["commune", "district", "canton"]


class PlaceOfInterestBase(BaseModel):
    code: str | None = None
    default_name: str
    name_fr: str | None = None
    name_de: str | None = None
    name_it: str | None = None
    name_rm: str | None = None
    name_en: str | None = None
    pos: tuple[float, float] = Field(..., description="[lat, lon]")

    @field_validator("code")
    @classmethod
    def normalize_code(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().lower()
        if not v:
            raise ValueError("empty code")
        return v

    @field_validator("pos")
    @classmethod
    def check_pos(cls, p: tuple[float, float]) -> tuple[float, float]:
        lat, lon = p
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError("invalid lat/lon")
        return (float(lat), float(lon))


class PlaceOfInterestClientOut(BaseModel):
    code: str
    name: str
    pos: tuple[float, float]
    geo_type: Literal[
        "commune",
        "district",
        "canton",
    ]


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
    name_fr: str | None = None
    name_de: str | None = None
    name_it: str | None = None
    name_rm: str | None = None
    name_en: str | None = None


class GeoSuggestionResponse(BaseModel):
    """
    Réponse standardisée pour la recherche géographique.
    """

    success: bool
    detail: str
    data: list[GeoSuggestionOut]


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
    data: GeoPointOut | None = None


class LocalizedPlaceNamesOut(BaseModel):
    fr: str | None = None
    de: str | None = None
    it: str | None = None
    rm: str | None = None
    en: str | None = None


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
    name: str
    default_name: str
    names: LocalizedPlaceNamesOut
    pos: tuple[float, float] = Field(..., description="[lat, lon]")


class PlaceOfInterestSuggestResponse(BaseModel):
    """
    Réponse standardisée pour la route publique de suggestion.
    """

    success: bool
    detail: str
    data: list[PlaceOfInterestSuggestOut]
