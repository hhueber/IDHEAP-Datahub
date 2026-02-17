from typing import Optional, Set


from app.db import get_db
from app.repositories.placeOfInterest_repo import list_placeOfInterest_for_lang
from app.schemas.choropleth import ChoroplethGranularity, ChoroplethResponse
from app.schemas.geo import GeoBundle
from app.schemas.placeOfInterest import PlaceOfInterestClientOut
from app.services.choropleth_service import build_choropleth
from app.services.geo_service import ALL_LAYERS, get_geo_by_year_selective
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


def _parse_layers(layers_csv: Optional[str]) -> Set[str]:
    if not layers_csv:
        return set(ALL_LAYERS)
    wanted = {s.strip().lower() for s in layers_csv.split(",") if s.strip()}
    unknown = wanted - ALL_LAYERS
    if unknown:
        raise ValueError(f"Unknown layers: {', '.join(sorted(unknown))}")
    return wanted


# TODO: ameliorer la vitesse de traitement actuellement entre 3 - 6 secondes
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
    return await get_geo_by_year_selective(db, year, layers=wanted, clear_others=clear_others)


@router.get("/placeOfInterest", response_model=list[PlaceOfInterestClientOut])
async def get_placeOfInterest_for_map(
    lang: str = Query("en", description="ISO code de langue, ex: fr, de, it, ro, en"),
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
    db: AsyncSession = Depends(get_db),
):
    fc, legend, meta = await build_choropleth(
        db,
        scope=scope,
        question_uid=question_uid,
        year=year,
        granularity=granularity,
    )
    return ChoroplethResponse(
        question_uid=question_uid,
        year_requested=year,
        granularity=granularity,
        year_geo_districts=meta.get("districts"),
        year_geo_cantons=meta.get("cantons"),
        legend=legend,
        feature_collection=fc,
    )
