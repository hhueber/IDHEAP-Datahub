from datetime import date
from typing import Optional, Set, Tuple
import json


from app.models.canton import Canton
from app.models.canton_map import CantonMap
from app.models.commune import Commune
from app.models.commune_map import CommuneMap
from app.models.country import Country
from app.models.district import District
from app.models.district_map import DistrictMap
from app.models.lake import Lake
from app.models.lake_map import LakeMap
from app.schemas.geo import Feature, FeatureCollection, GeoBundle, Geometry, YearMeta
from geoalchemy2 import functions as geofunc
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def _fc_for_layer(
    session: AsyncSession,
    MapModel,
    EntModel,
    rel_attr: str,
    year_val: int,
    props: Tuple[Tuple[str, str, bool], ...],
) -> FeatureCollection:
    labeled_cols = []
    prop_keys = []
    for out_key, attr_name, is_optional in props:
        col = getattr(EntModel, attr_name, None)
        if col is None:
            if is_optional:
                col = func.null()
            else:
                raise AttributeError(f"{EntModel.__name__}.{attr_name} missing")
        labeled_cols.append(col.label(out_key))
        prop_keys.append(out_key)

    stmt = (
        select(
            geofunc.ST_AsGeoJSON(MapModel.geometry, maxdecimaldigits=5).label("geojson"),
            *labeled_cols,
        )
        .join(getattr(MapModel, rel_attr))
        .where(MapModel.year == year_val)
    )
    return await _features_from_stmt(session, stmt, tuple(prop_keys))


async def _max_year_leq(session: AsyncSession, model, y: int) -> Optional[int]:
    q = select(func.max(model.year)).where(model.year <= y)
    res = await session.execute(q)
    return res.scalar_one_or_none()


async def _features_from_stmt(session: AsyncSession, stmt, prop_keys: Tuple[str, ...]) -> FeatureCollection:
    rows = (await session.execute(stmt)).all()
    feats = []
    for row in rows:
        m = row._mapping
        gj = json.loads(m["geojson"])  # ST_AsGeoJSON -> str
        props = {k: m[k] for k in prop_keys if k in m}
        feats.append(Feature(geometry=Geometry(**gj), properties=props))
    return FeatureCollection(features=feats)


ALL_LAYERS = {"country", "lakes", "cantons", "districts", "communes"}


async def get_geo_by_year_selective(
    session: AsyncSession,
    requested_year: Optional[int],
    layers: Set[str],
    clear_others: bool = False,
) -> GeoBundle:
    """
    Returns only the requested layers.
    - layers: subset of {"country","lakes","cantons",“districts”,"communes"}
    - clear_others: if True, explicitly includes other layers set to None
                    if False, omits them to facilitate front-end merging
    """
    y_req = int(requested_year or date.today().year)

    # Calcule les années uniquement pour les couches demandées
    y_cantons = y_districts = y_lakes = y_communes = None
    if "cantons" in layers:
        y_cantons = await _max_year_leq(session, CantonMap, y_req)
    if "districts" in layers:
        y_districts = await _max_year_leq(session, DistrictMap, y_req)
    if "lakes" in layers:
        y_lakes = await _max_year_leq(session, LakeMap, y_req)
    if "communes" in layers:
        y_communes = await _max_year_leq(session, CommuneMap, y_req)

    # Construit les FeatureCollections demandées
    country_fc = lakes_fc = cantons_fc = districts_fc = communes_fc = None

    if "country" in layers:
        country_fc = await _features_from_stmt(
            session,
            select(
                geofunc.ST_AsGeoJSON(Country.geometry, maxdecimaldigits=5).label("geojson"),
                Country.uid.label("uid"),
            ),
            ("uid",),
        )

    # Lakes
    if "lakes" in layers and y_lakes is not None:
        lakes_fc = await _fc_for_layer(
            session,
            LakeMap,
            Lake,
            "lake",
            y_lakes,
            (("uid", "uid", False), ("name", "name", False), ("code", "code", False)),
        )

    # Cantons
    if "cantons" in layers and y_cantons is not None:
        cantons_fc = await _fc_for_layer(
            session,
            CantonMap,
            Canton,
            "canton",
            y_cantons,
            (("uid", "uid", False), ("code", "code", False), ("name", "name", False)),
        )

    # Districts
    if "districts" in layers and y_districts is not None:
        districts_fc = await _fc_for_layer(
            session,
            DistrictMap,
            District,
            "district",
            y_districts,
            (("uid", "uid", False), ("name", "name", False), ("code", "code", True)),
        )

    # Communes
    if "communes" in layers and y_communes is not None:
        communes_fc = await _fc_for_layer(
            session,
            CommuneMap,
            Commune,
            "commune",
            y_communes,
            (("uid", "uid", False), ("name", "name", False), ("code", "code", False)),
        )

    # Prépare YearMeta (remplit uniquement ce qui est demandé)
    year_meta = YearMeta(
        requested=y_req,
        country=(None if "country" in layers else None),  # pas de notion d'année country
        lakes=y_lakes if "lakes" in layers else None,
        cantons=y_cantons if "cantons" in layers else None,
        districts=y_districts if "districts" in layers else None,
    )

    # On construit la réponse GeoBundle, en incluant ou omettant les clés non demandées
    bundle_kwargs = dict(year=year_meta)
    if "country" in layers or clear_others:
        bundle_kwargs["country"] = country_fc
    if "lakes" in layers or clear_others:
        bundle_kwargs["lakes"] = lakes_fc
    if "cantons" in layers or clear_others:
        bundle_kwargs["cantons"] = cantons_fc
    if "districts" in layers or clear_others:
        bundle_kwargs["districts"] = districts_fc
    if "communes" in layers or clear_others:
        bundle_kwargs["communes"] = communes_fc

    return GeoBundle(**bundle_kwargs)
