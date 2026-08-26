from typing import Optional, Set


from app.db import get_db
from app.repositories.placeOfInterest_repo import list_placeOfInterest_for_lang
from app.schemas.choropleth import (
    ChoroplethGeometriesResponse,
    ChoroplethGranularity,
    ChoroplethResponse,
    ChoroplethValuesResponse,
)
from app.schemas.geo import GeoBundle
from app.schemas.placeOfInterest import PlaceOfInterestClientOut
from app.services.choropleth_service import build_choropleth, build_choropleth_geometries, build_choropleth_values
from app.services.comparison_service import build_area_comparison
from app.services.geo_service import ALL_LAYERS, get_geo_by_year_selective
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import Response
import orjson


router = APIRouter()


def _parse_layers(layers_csv: Optional[str]) -> Set[str]:
    if not layers_csv:
        return set(ALL_LAYERS)
    wanted = {s.strip().lower() for s in layers_csv.split(",") if s.strip()}
    unknown = wanted - ALL_LAYERS
    if unknown:
        raise ValueError(f"Unknown layers: {', '.join(sorted(unknown))}")
    return wanted


@router.get("/by_year", response_model=GeoBundle)
async def geo_by_year(
    year: int | None = Query(None, description="Année demandée; défaut = année courante"),
    layers: str | None = Query(None, description="Les couches demandées: country,lakes,cantons,districts,communes"),
    clear_others: bool = Query(
        False, description="Si vrai, met à null les couches non demandées donc si null = modifier dans front"
    ),
    db: AsyncSession = Depends(get_db),
):
    wanted = _parse_layers(layers)
    bundle = await get_geo_by_year_selective(db, year, layers=wanted, clear_others=clear_others)
    return Response(content=orjson.dumps(bundle.model_dump(mode="json")), media_type="application/json")


@router.get("/placeOfInterest", response_model=list[PlaceOfInterestClientOut])
async def get_placeOfInterest_for_map(
    lang: str = Query("en", description="ISO code de langue, ex: fr, de, it, rm, en"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retourne la liste des villes actives avec un nom déjà dans la bonne langue.
    Si aucune ville n'est en DB, renvoie simplement [].
    """
    return await list_placeOfInterest_for_lang(db, lang)


@router.get("/choropleth", response_model=ChoroplethResponse)
async def commune_choropleth(
    scope: str = Query(..., pattern="^(per_survey|global)$"),
    question_uid: int = Query(...),
    year: int = Query(...),
    granularity: ChoroplethGranularity = Query("commune"),
    lang: str = Query("en"),
    db: AsyncSession = Depends(get_db),
):
    """
    Return data required to render a choropleth map of Swiss communes.

    Each commune is colored according to the value of a given survey question
    for a specific year.

    Parameters:
        scope (str): Aggregation mode ("per_survey" or "global").
        question_uid (int): Survey question identifier.
        year (int): Year of the data to display.
        granularity (ChoroplethGranularity): Geographic level used for the map
            (e.g. "commune", "district", "canton", or "federal").

    Returns:
        ChoroplethResponse: GeoJSON FeatureCollection, legend and metadata
        needed to render the choropleth map.
    """
    fc, legend, meta = await build_choropleth(
        db,
        scope=scope,
        question_uid=question_uid,
        year=year,
        granularity=granularity,
        lang=lang,
    )
    response = ChoroplethResponse(
        question_uid=question_uid,
        year_requested=year,
        granularity=granularity,
        year_geo_districts=meta.get("districts"),
        year_geo_cantons=meta.get("cantons"),
        legend=legend,
        feature_collection=fc,
    )
    _content = orjson.dumps(response.model_dump(mode="json"))
    return Response(content=_content, media_type="application/json")


@router.get("/choropleth/geometries", response_model=ChoroplethGeometriesResponse)
async def choropleth_geometries(
    year: int = Query(...),
    granularity: ChoroplethGranularity = Query("commune"),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the geographic shapes for a given granularity and year,
    with no dependency on survey answers.
    """
    fc, meta = await build_choropleth_geometries(db, year=year, granularity=granularity)
    response = ChoroplethGeometriesResponse(
        year_requested=year,
        year_geo_districts=meta.get("districts"),
        year_geo_cantons=meta.get("cantons"),
        granularity=granularity,
        feature_collection=fc,
    )
    _content = orjson.dumps(response.model_dump(mode="json"))
    return Response(content=_content, media_type="application/json")


@router.get("/choropleth/values", response_model=ChoroplethValuesResponse)
async def choropleth_values(
    scope: str = Query(..., pattern="^(per_survey|global)$"),
    question_uid: int = Query(...),
    year: int = Query(...),
    granularity: ChoroplethGranularity = Query("commune"),
    lang: str = Query("en"),
    db: AsyncSession = Depends(get_db),
):
    """
    Return legend and per-unit values for a given question/year/granularity,
    with no geometry payload.
    """
    legend, values, _meta = await build_choropleth_values(
        db,
        scope=scope,
        question_uid=question_uid,
        year=year,
        granularity=granularity,
        lang=lang,
    )
    response = ChoroplethValuesResponse(
        question_uid=question_uid,
        year_requested=year,
        granularity=granularity,
        legend=legend,
        values=values,
    )
    _content = orjson.dumps(response.model_dump(mode="json"))
    return Response(content=_content, media_type="application/json")


@router.get("/comparison")
async def get_area_comparison(
    scope: str = Query(..., pattern="^(per_survey|global)$"),
    question_uid: int = Query(...),
    year: int = Query(...),
    area_uid: int = Query(...),
    level: ChoroplethGranularity = Query(...),
    db: AsyncSession = Depends(get_db),
):
    return await build_area_comparison(
        db,
        scope=scope,
        question_uid=question_uid,
        year=year,
        area_uid=area_uid,
        level=level,
    )
