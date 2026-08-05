from datetime import date
from typing import Optional, Set, Tuple
import json


from app.core.geo_config import THEME_MAP_PREVIEW_CANTON_OFS_ID
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
from sqlalchemy import and_, func, select
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


async def get_geo_by_canton_preview(
    session: AsyncSession,
    canton_ofs_id: int = THEME_MAP_PREVIEW_CANTON_OFS_ID,
    requested_year: Optional[int] = None,
) -> GeoBundle:
    """
    Retourne les couches GeoJSON nécessaires à une preview de carte limitée
    à un seul canton.

    Cette méthode est utilisée pour la configuration du thème afin d'éviter
    de charger toutes les géométries de Suisse dans une simple mini-preview.

    Elle récupère :
    - le canton correspondant à l'identifiant OFS demandé
    - les districts rattachés à ce canton
    - les communes rattachées aux districts du canton
    - les lacs qui intersectent la géométrie du canton

    Le canton utilisé par défaut est défini par
    THEME_MAP_PREVIEW_CANTON_OFS_ID.

    Args:
        session: Session SQLAlchemy async utilisée pour exécuter les requêtes.
        canton_ofs_id: Identifiant OFS du canton à afficher dans la preview.
        requested_year: Année demandée pour les géométries. Si aucune année
            n'est fournie, l'année courante est utilisée, puis la dernière
            année disponible inférieure ou égale est sélectionnée par couche.

    Returns:
        GeoBundle: Bundle GeoJSON contenant uniquement les couches utiles à
        la preview ciblée.
    """
    y_req = int(requested_year or date.today().year)

    canton_uid = (await session.execute(select(Canton.uid).where(Canton.ofs_id == canton_ofs_id))).scalar_one_or_none()

    if canton_uid is None:
        # On retourne volontairement un GeoBundle vide plutôt que de lever une erreur.
        # La preview de thème est uniquement décorative : si le canton configuré
        # n'existe pas dans les données, l'UI peut afficher un état "aucune donnée"
        # sans bloquer le chargement de la page de configuration.
        return GeoBundle(
            year=YearMeta(
                requested=y_req,
                country=None,
                lakes=None,
                cantons=None,
                districts=None,
            ),
            country=None,
            lakes=None,
            cantons=FeatureCollection(features=[]),
            districts=FeatureCollection(features=[]),
            communes=FeatureCollection(features=[]),
        )

    # On prend pour chaque table de géométrie, la dernière année
    y_cantons = await _max_year_leq(session, CantonMap, y_req)
    y_districts = await _max_year_leq(session, DistrictMap, y_req)
    y_communes = await _max_year_leq(session, CommuneMap, y_req)
    y_lakes = await _max_year_leq(session, LakeMap, y_req)

    canton_fc = FeatureCollection(features=[])
    districts_fc = FeatureCollection(features=[])
    communes_fc = FeatureCollection(features=[])
    lakes_fc = FeatureCollection(features=[])

    if y_cantons is not None:
        # Géométrie du canton sélectionné uniquement.
        canton_fc = await _features_from_stmt(
            session,
            select(
                geofunc.ST_AsGeoJSON(CantonMap.geometry, maxdecimaldigits=5).label("geojson"),
                Canton.uid.label("uid"),
                Canton.code.label("code"),
                Canton.name.label("name"),
            )
            .join(CantonMap.canton)
            .where(
                CantonMap.year == y_cantons,
                Canton.uid == canton_uid,
            ),
            ("uid", "code", "name"),
        )

    if y_districts is not None:
        # Les districts sont directement rattachés au canton via District.canton_uid.
        districts_fc = await _features_from_stmt(
            session,
            select(
                geofunc.ST_AsGeoJSON(DistrictMap.geometry, maxdecimaldigits=5).label("geojson"),
                District.uid.label("uid"),
                District.name.label("name"),
                District.code.label("code"),
            )
            .join(DistrictMap.district)
            .where(
                DistrictMap.year == y_districts,
                District.canton_uid == canton_uid,
            ),
            ("uid", "name", "code"),
        )

    if y_communes is not None:
        # Les communes ne sont pas directement rattachées au canton.
        # On passe donc par leur district pour limiter la preview aux communes du canton.
        communes_fc = await _features_from_stmt(
            session,
            select(
                geofunc.ST_AsGeoJSON(CommuneMap.geometry, maxdecimaldigits=5).label("geojson"),
                Commune.uid.label("uid"),
                Commune.name.label("name"),
                Commune.code.label("code"),
            )
            .join(CommuneMap.commune)
            .join(District, Commune.district_uid == District.uid)
            .where(
                CommuneMap.year == y_communes,
                District.canton_uid == canton_uid,
            ),
            ("uid", "name", "code"),
        )

    if y_lakes is not None and y_cantons is not None:
        # Les lacs ne sont pas reliés aux cantons par une clé étrangère.
        # On les sélectionne donc spatialement : tout lac qui intersecte
        # la géométrie du canton est inclus dans la preview.
        lakes_fc = await _features_from_stmt(
            session,
            select(
                geofunc.ST_AsGeoJSON(LakeMap.geometry, maxdecimaldigits=5).label("geojson"),
                Lake.uid.label("uid"),
                Lake.name.label("name"),
                Lake.code.label("code"),
            )
            .join(LakeMap.lake)
            .join(
                CantonMap,
                and_(
                    CantonMap.year == y_cantons,
                    CantonMap.canton_uid == canton_uid,
                ),
            )
            .where(
                LakeMap.year == y_lakes,
                geofunc.ST_Intersects(LakeMap.geometry, CantonMap.geometry),
            ),
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
        country=None,
        lakes=lakes_fc,
        cantons=canton_fc,
        districts=districts_fc,
        communes=communes_fc,
    )
