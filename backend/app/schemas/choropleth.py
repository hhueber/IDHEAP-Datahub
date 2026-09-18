from typing import Any, Literal


from app.schemas.geo import FeatureCollection
from pydantic import BaseModel, Field


ChoroplethGranularity = Literal["commune", "district", "canton", "federal"]


class LegendItem(BaseModel):
    label: str
    color: str

    # categorical
    value: Any | None = None

    # gradient
    min: float | None = None
    max: float | None = None


class GradientMeta(BaseModel):
    mode: Literal["continuous"] = "continuous"
    start: str
    end: str
    vmin: float
    vmax: float
    ticks: list[float]


class MapLegend(BaseModel):
    type: Literal["categorical", "gradient"]
    title: str
    items: list[LegendItem]
    gradient: GradientMeta | None = None


class ChoroplethResponse(BaseModel):
    question_uid: int
    year_requested: int
    year_geo_communes: int | None = None
    year_geo_districts: int | None = None
    year_geo_cantons: int | None = None
    granularity: ChoroplethGranularity
    legend: MapLegend
    feature_collection: FeatureCollection = Field(..., description="GeoJSON FeatureCollection des communes")


class ChoroplethGeometriesResponse(BaseModel):
    year_requested: int
    year_geo_districts: int | None = None
    year_geo_cantons: int | None = None
    granularity: ChoroplethGranularity
    feature_collection: FeatureCollection


class ChoroplethValueEntry(BaseModel):
    value: Any | None = None
    value_kind: str  # "value" | "no_data" | "no_response"
    fill_color: str = "#cccccc"
    fill_pattern: Any | None = None
    special_dominant: bool = False
    top_real_count: int = 0
    cnt_null: int = 0
    cnt_empty: int = 0


class ChoroplethValuesResponse(BaseModel):
    question_uid: int
    year_requested: int
    granularity: ChoroplethGranularity
    legend: MapLegend
    values: dict[str, ChoroplethValueEntry]
