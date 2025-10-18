from time import perf_counter


from app.db import get_db
from app.schemas.geo import GeoBundle
from app.services.geo_service import get_geo_by_year
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


# TODO: ameliorer le temps de traitement dans service/geo_service.py (actuellement ~5s)
# Leaflet attend du GeoJSON en WGS84 (EPSG:4326), pas de l’EWKB 2056 (peut etre transformer dans script)
@router.get("/by_year", response_model=GeoBundle)
async def geo_by_year(
    year: int | None = Query(None, description="Année demandée; défaut = année courante"),
    db: AsyncSession = Depends(get_db),
):
    return await get_geo_by_year(db, year)
