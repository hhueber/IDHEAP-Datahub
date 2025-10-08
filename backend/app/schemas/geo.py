from typing import Any, Dict, List, Optional


from pydantic import BaseModel, Field


class Geometry(BaseModel):
    type: str
    coordinates: Any  # listes imbriquées GeoJSON


class Feature(BaseModel):
    type: str = "Feature"
    geometry: Geometry
    properties: Dict[str, Any] = Field(default_factory=dict)


class FeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[Feature]


class YearMeta(BaseModel):
    # année demandée par le client (par défaut: année courante)
    requested: int
    # années réellement utilisées (max <= requested) par couche versionnée
    country: Optional[int] = None
    lakes: Optional[int] = None
    cantons: Optional[int] = None
    districts: Optional[int] = None


class GeoBundle(BaseModel):
    year: YearMeta
    country: Optional[FeatureCollection] = None
    lakes: Optional[FeatureCollection] = None
    cantons: Optional[FeatureCollection] = None
    districts: Optional[FeatureCollection] = None
