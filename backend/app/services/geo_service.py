from datetime import date
from typing import Optional, Tuple
import json


from app.models.canton import Canton
from app.models.canton_map import CantonMap
from app.models.country import Country
from app.models.district import District
from app.models.district_map import DistrictMap
from app.models.lake import Lake
from app.models.lake_map import LakeMap
from app.schemas.geo import Feature, FeatureCollection, GeoBundle, Geometry, YearMeta
from geoalchemy2 import functions as geofunc
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def _max_year_leq(session: AsyncSession, model, y: int) -> Optional[int]:
    """Max(model.year) WHERE year <= y, sinon None."""
    q = select(func.max(model.year)).where(model.year <= y)
    res = await session.execute(q)
    return res.scalar_one_or_none()


async def _features_from_stmt(session: AsyncSession, stmt, prop_keys: Tuple[str, ...]) -> FeatureCollection:
    rows = (await session.execute(stmt)).all()
    feats = []
    for row in rows:
        m = row._mapping
        gj = json.loads(m["geojson"])  # ST_AsGeoJSON -> str -> dict
        props = {k: m[k] for k in prop_keys if k in m}
        feats.append(Feature(geometry=Geometry(**gj), properties=props))
    return FeatureCollection(features=feats)


async def get_geo_by_year(session: AsyncSession, requested_year: Optional[int]) -> GeoBundle:
    # Année demandée (défaut = année courante)
    y_req = int(requested_year or date.today().year)

    # Recherche des millésimes disponibles (≤ année demandée)
    y_cantons = await _max_year_leq(session, CantonMap, y_req)
    y_districts = await _max_year_leq(session, DistrictMap, y_req)
    y_lakes = await _max_year_leq(session, LakeMap, y_req)

    # Country (pas de notion d'année)
    country_fc = await _features_from_stmt(
        session,
        select(
            geofunc.ST_AsGeoJSON(Country.geometry).label("geojson"),
            Country.uid.label("uid"),
        ),
        ("uid",),
    )

    # Lakes — désormais version millésimée
    lakes_fc = None
    if y_lakes is not None:
        lakes_fc = await _features_from_stmt(
            session,
            select(
                geofunc.ST_AsGeoJSON(LakeMap.geometry).label("geojson"),
                Lake.uid.label("uid"),
                Lake.name.label("name"),
                Lake.code.label("code"),
            )
            .join(LakeMap.lake)
            .where(LakeMap.year == y_lakes),
            ("uid", "name", "code"),
        )

    # Cantons — millésimé
    cantons_fc = None
    if y_cantons is not None:
        cantons_fc = await _features_from_stmt(
            session,
            select(
                geofunc.ST_AsGeoJSON(CantonMap.geometry).label("geojson"),
                Canton.uid.label("uid"),
                Canton.code.label("code"),
                Canton.name.label("name"),
            )
            .join(CantonMap.canton)
            .where(CantonMap.year == y_cantons),
            ("uid", "code", "name"),
        )

    # Districts — millésimé
    districts_fc = None
    if y_districts is not None:
        has_code = hasattr(District, "code")
        code_col = getattr(District, "code") if has_code else func.null()
        districts_fc = await _features_from_stmt(
            session,
            select(
                geofunc.ST_AsGeoJSON(DistrictMap.geometry).label("geojson"),
                District.uid.label("uid"),
                District.name.label("name"),
                code_col.label("code"),
            )
            .join(DistrictMap.district)
            .where(DistrictMap.year == y_districts),
            ("uid", "name", "code"),
        )

    return GeoBundle(
        year=YearMeta(
            requested=y_req,
            country=None,
            lakes=y_lakes,
            cantons=y_cantons,
            districts=y_districts,
        ),
        country=country_fc,
        lakes=lakes_fc,
        cantons=cantons_fc,
        districts=districts_fc,
    )
