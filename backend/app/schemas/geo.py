"""Pydantic schemas exposed by the API.

Conventions:
- Precise types (Optional, List, Dict, etc.)
"""

from typing import Any


from pydantic import BaseModel, Field


class Geometry(BaseModel):
    type: str
    coordinates: Any  # listes imbriquées GeoJSON


class Feature(BaseModel):
    type: str = "Feature"
    geometry: Geometry
    properties: dict[str, Any] = Field(default_factory=dict)


class FeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: list[Feature]


class YearMeta(BaseModel):
    # année demandée par le client (par défaut: année courante)
    requested: int
    # années réellement utilisées (max <= requested) par couche versionnée
    country: int | None = None
    lakes: int | None = None
    cantons: int | None = None
    districts: int | None = None
    communes: int | None = None


class GeoBundle(BaseModel):
    year: YearMeta
    country: FeatureCollection | None = None
    lakes: FeatureCollection | None = None
    cantons: FeatureCollection | None = None
    districts: FeatureCollection | None = None
    communes: FeatureCollection | None = None
