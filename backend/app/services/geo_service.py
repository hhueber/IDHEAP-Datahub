from datetime import date
from typing import Optional, Tuple
import json


from app.models.canton import Canton
from app.models.canton_map import CantonMap
from app.models.country import Country
from app.models.district import District
from app.models.district_map import DistrictMap
from app.models.lake import Lake
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
        gj = json.loads(m["geojson"])
        props = {k: m[k] for k in prop_keys if k in m}
        feats.append(Feature(geometry=Geometry(**gj), properties=props))
    return FeatureCollection(features=feats)


async def get_geo_by_year(session: AsyncSession, requested_year: Optional[int]) -> GeoBundle:
    # Année par défaut = année courante
    y_req = int(requested_year or date.today().year)

    # Country / Lake n'ont pas "year" dans les modèles fournis -> None
    y_cantons = await _max_year_leq(session, CantonMap, y_req)
    y_districts = await _max_year_leq(session, DistrictMap, y_req)

    # Country - meme chose que cantons pour Leaflet
    country_fc = await _features_from_stmt(
        session,
        select(
            # TODO: Leaflet attend du GeoJSON en WGS84 (EPSG:4326), pas de l’EWKB 2056
            geofunc.ST_AsGeoJSON(geofunc.ST_Transform(Country.geometry, 4326)).label("geojson"),
            Country.uid.label("uid"),
        ),
        ("uid",),
    )

    # Lakes - meme chose que cantons pour Leaflet
    lakes_fc = await _features_from_stmt(
        session,
        select(
            # TODO: Leaflet attend du GeoJSON en WGS84 (EPSG:4326), pas de l’EWKB 2056
            geofunc.ST_AsGeoJSON(geofunc.ST_Transform(Lake.geometry, 4326)).label("geojson"),
            Lake.uid.label("uid"),
            Lake.name.label("name"),
            Lake.code.label("code"),
        ),
        ("uid", "name", "code"),
    )

    # Cantons — si une année <= demandée existe
    cantons_fc = None
    if y_cantons is not None:
        cantons_fc = await _features_from_stmt(
            session,
            select(
                # TODO:
                # Leaflet attend du GeoJSON en WGS84 (EPSG:4326), pas de l’EWKB 2056 (peut etre transformer dans script)
                # si ok faire cela:
                # geofunc.ST_AsGeoJSON(Country.geometry).label("geojson"),
                geofunc.ST_AsGeoJSON(geofunc.ST_Transform(CantonMap.geometry, 4326)).label("geojson"),
                Canton.uid.label("uid"),
                Canton.code.label("code"),
                Canton.name.label("name"),
            )
            .join(CantonMap.canton)
            .where(CantonMap.year == y_cantons),
            ("uid", "code", "name"),
        )

    # Districts — meme chose que cantons pour Leaflet
    districts_fc = None
    if y_districts is not None:
        has_code = hasattr(District, "code")
        code_col = getattr(District, "code") if has_code else func.null()
        districts_fc = await _features_from_stmt(
            session,
            select(
                # TODO: Leaflet attend du GeoJSON en WGS84 (EPSG:4326), pas de l’EWKB 2056
                geofunc.ST_AsGeoJSON(geofunc.ST_Transform(DistrictMap.geometry, 4326)).label("geojson"),
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
            lakes=None,
            cantons=y_cantons,
            districts=y_districts,
        ),
        country=country_fc,
        lakes=lakes_fc,
        cantons=cantons_fc,
        districts=districts_fc,
    )
