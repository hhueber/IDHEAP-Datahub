from typing import Any, Optional
import json


from app.models.answer import Answer
from app.models.canton import Canton
from app.models.canton_map import CantonMap
from app.models.commune import Commune
from app.models.commune_map import CommuneMap
from app.models.district import District
from app.models.district_map import DistrictMap
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from app.schemas.choropleth import ChoroplethGranularity, GradientMeta, LegendItem, MapLegend
from app.schemas.geo import Feature, FeatureCollection, Geometry
from geoalchemy2 import functions as geofunc
from sqlalchemy import and_, case, cast, func, Integer, Numeric, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement
from sqlalchemy.sql.selectable import FromClause


NO_DATA_COLOR = "#cccccc"  # gris
NO_RESPONSE_COLOR = "#f59e0b"  # orange/ambre
GRAD_START = "#22c55e"  # vert
GRAD_END = "#3b82f6"  # bleu
MAX_CATEGORIES = 12  # légende: 12
MAX_MODE_DISTINCT = 12  # règle: <= 12 => mode, > 12 => moyenne


def _default_colors(n: int) -> list[str]:
    # palette simple, lisible. Ajustable plus tard.
    base = [
        "#fee5d9",
        "#fcae91",
        "#fb6a4a",
        "#de2d26",
        "#a50f15",
        "#eff3ff",
        "#bdd7e7",
        "#6baed6",
        "#3182bd",
        "#08519c",
        "#edf8e9",
        "#bae4b3",
        "#74c476",
        "#31a354",
        "#006d2c",
    ]
    if n <= len(base):
        return base[:n]
    return [base[i % len(base)] for i in range(n)]


async def _global_distinct_non_empty_count(db: AsyncSession, q_uid: int, year: int) -> int:
    vtrim = func.btrim(Answer.value)
    stmt = select(func.count(func.distinct(vtrim))).where(
        Answer.question_uid == q_uid,
        Answer.year == year,
        Answer.value.isnot(None),
        vtrim != "",
    )
    v = (await db.execute(stmt)).scalar_one_or_none()
    return int(v or 0)


def _apply_fill_colors(
    features: list[Feature],
    legend: MapLegend,
    categorical_map: dict[str | None, str] | None,
    vmin: float | None,
    vmax: float | None,
) -> None:
    for f in features:
        props = f.properties
        kind = props.get("value_kind")
        v = props.get("value")

        if kind == "no_data":
            props["fill_color"] = NO_DATA_COLOR
            continue
        if kind == "no_response":
            props["fill_color"] = NO_RESPONSE_COLOR
            continue

        if legend.type == "categorical":
            props["fill_color"] = (categorical_map or {}).get(v, "#999999")
            continue

        # gradient
        try:
            x = float(v)
        except Exception:
            props["fill_color"] = NO_DATA_COLOR
            continue

        if vmin is None or vmax is None or vmin == vmax:
            props["fill_color"] = _interp_color(GRAD_START, GRAD_END, 0.5)
        else:
            t = (x - vmin) / (vmax - vmin)
            props["fill_color"] = _interp_color(GRAD_START, GRAD_END, t)


async def _resolve_question_per_survey_uid_for_global(
    db: AsyncSession,
    question_global_uid: int,
    year: int,
) -> int | None:
    stmt = (
        select(QuestionPerSurvey.uid)
        .join(Survey, Survey.uid == QuestionPerSurvey.survey_uid)
        .where(QuestionPerSurvey.question_global_uid == question_global_uid, Survey.year == year)
        .limit(1)
    )
    uid = (await db.execute(stmt)).scalar_one_or_none()
    return int(uid) if uid is not None else None


def _normalize_value(v: Optional[str]) -> tuple[str, Optional[str]]:
    """
    kind:
      - no_data: NULL (ou pas d'answer => outerjoin value=None)
      - no_response: string vide/espaces
      - value: vraie valeur
    """
    if v is None:
        return ("no_data", None)

    s = v.strip()
    if s == "":
        return ("no_response", "")

    # optionnel: placeholders considérés comme pas de donnée
    if s.lower() in {"nan", "null", "none"}:
        return ("no_data", None)

    return ("value", s)


def _make_ticks(vmin: float, vmax: float) -> list[float]:
    # 5 ticks simples, lisibles
    if vmin == vmax:
        return [vmin]
    return [
        vmin,
        vmin + (vmax - vmin) * 0.25,
        vmin + (vmax - vmin) * 0.50,
        vmin + (vmax - vmin) * 0.75,
        vmax,
    ]


def _hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _rgb_to_hex(r: int, g: int, b: int) -> str:
    return "#{:02x}{:02x}{:02x}".format(r, g, b)


def _interp_color(c1: str, c2: str, t: float) -> str:
    t = max(0.0, min(1.0, t))
    r1, g1, b1 = _hex_to_rgb(c1)
    r2, g2, b2 = _hex_to_rgb(c2)
    r = int(round(r1 + (r2 - r1) * t))
    g = int(round(g1 + (g2 - g1) * t))
    b = int(round(b1 + (b2 - b1) * t))
    return _rgb_to_hex(r, g, b)


async def _compute_global_value(
    db: AsyncSession, q_uid: int, year: int, *, use_mode: bool
) -> tuple[str, Optional[str]]:
    vtrim = func.btrim(Answer.value)
    is_num = _numeric_regex_col()

    avg_numeric = func.avg(cast(Answer.value, Numeric)).filter(and_(Answer.value.isnot(None), vtrim != "", is_num))

    stmt = select(
        func.count().filter(and_(Answer.value.isnot(None), vtrim == "")).label("cnt_empty"),
        func.count().filter(and_(Answer.value.isnot(None), vtrim != "")).label("cnt_non_empty"),
        func.count().filter(and_(Answer.value.isnot(None), vtrim != "", is_num)).label("cnt_num"),
        cast(func.round(avg_numeric, 0), Integer).label("avg_num_int"),
        func.mode().within_group(Answer.value).filter(and_(Answer.value.isnot(None), vtrim != "")).label("mode_text"),
    ).where(Answer.question_uid == q_uid, Answer.year == year)

    r = (await db.execute(stmt)).mappings().first() or {}
    cnt_non_empty = int(r.get("cnt_non_empty") or 0)
    cnt_empty = int(r.get("cnt_empty") or 0)
    cnt_num = int(r.get("cnt_num") or 0)

    if cnt_non_empty == 0 and cnt_empty > 0:
        return ("no_response", "")
    if cnt_non_empty == 0:
        return ("no_data", None)

    if use_mode:
        return _normalize_value(str(r.get("mode_text")) if r.get("mode_text") is not None else None)

    if r.get("avg_num_int") is not None and cnt_num >= 1:
        return ("value", str(int(r["avg_num_int"])))

    return _normalize_value(str(r.get("mode_text")) if r.get("mode_text") is not None else None)


def _build_legend_and_colors(features: list[Feature]) -> MapLegend:
    raw_values: list[tuple[str, Optional[str]]] = []
    numeric_values: list[float] = []

    for f in features:
        k = f.properties.get("value_kind")
        v = f.properties.get("value")
        raw_values.append((k, v))
        if k == "value" and v is not None:
            try:
                numeric_values.append(float(v))
            except Exception:
                pass

    real_values = [v for (k, v) in raw_values if k == "value" and v is not None]
    distinct = sorted(set(real_values))
    n_distinct = len(distinct)

    has_no_response = any(k == "no_response" for (k, _) in raw_values)
    has_no_data = any(k == "no_data" for (k, _) in raw_values)

    numeric_count = len(numeric_values)
    real_count = len(real_values)
    mostly_numeric = (real_count > 0) and (numeric_count / real_count >= 0.8)

    def _append_special(items: list[LegendItem]) -> None:
        if has_no_response:
            items.append(LegendItem(label="No response", color=NO_RESPONSE_COLOR, value=""))
        if has_no_data:
            items.append(LegendItem(label="No data", color=NO_DATA_COLOR, value=None))

    # categorical (<= 12)
    if 0 < n_distinct <= MAX_CATEGORIES:
        colors = _default_colors(n_distinct)
        items = [LegendItem(label=str(v), color=colors[i], value=v) for i, v in enumerate(distinct)]
        _append_special(items)
        legend = MapLegend(type="categorical", title="Responses", items=items)
        cmap = {str(v): colors[i] for i, v in enumerate(distinct)}
        _apply_fill_colors(features, legend, categorical_map=cmap, vmin=None, vmax=None)
        return legend

    # gradient (beaucoup de valeurs + numeric)
    if n_distinct > MAX_CATEGORIES and mostly_numeric and numeric_values:
        vmin = float(min(numeric_values))
        vmax = float(max(numeric_values))
        items: list[LegendItem] = []
        _append_special(items)
        legend = MapLegend(
            type="gradient",
            title="Value",
            items=items,
            gradient=GradientMeta(
                start=GRAD_START,
                end=GRAD_END,
                vmin=vmin,
                vmax=vmax,
                ticks=[float(x) for x in _make_ticks(vmin, vmax)],
            ),
        )
        _apply_fill_colors(features, legend, categorical_map=None, vmin=vmin, vmax=vmax)
        return legend

    # fallback top 12 + other
    top = distinct[:MAX_CATEGORIES]
    colors = _default_colors(len(top))
    items = [LegendItem(label=str(v), color=colors[i], value=v) for i, v in enumerate(top)]
    if n_distinct > MAX_CATEGORIES:
        items.append(LegendItem(label="Other", color="#999999", value="__other__"))
    _append_special(items)

    legend = MapLegend(type="categorical", title="Responses", items=items)
    cmap = {str(v): colors[i] for i, v in enumerate(top)}
    cmap["__other__"] = "#999999"

    for f in features:
        if f.properties.get("value_kind") == "value":
            v = f.properties.get("value")
            if v is not None and v not in cmap:
                f.properties["value"] = "__other__"

    _apply_fill_colors(features, legend, categorical_map=cmap, vmin=None, vmax=None)
    return legend


async def _nearest_year_sql_window(db: AsyncSession, model, target_year: int, year_window: int = 1) -> Optional[int]:
    """
    Renvoie l’année dispo la plus proche dans une fenêtre de +- year_window
    """
    y = model.year
    y_min = target_year - year_window
    y_max = target_year + year_window

    stmt = (
        select(y)
        .select_from(model)
        .where(and_(y >= y_min, y <= y_max))
        .group_by(y)
        .order_by(
            func.abs(y - target_year).asc(),
            case((y <= target_year, 0), else_=1).asc(),
            y.desc(),
        )
        .limit(1)
    )
    return (await db.execute(stmt)).scalar_one_or_none()


def _pick_aggregated_value(
    *,
    cnt_empty: int,
    cnt_null: int,
    cnt_non_empty: int,
    cnt_num: int,
    avg_num_int: Optional[int],
    mode_text: Optional[str],
    use_mode: bool,
) -> tuple[str, Optional[str]]:
    if cnt_non_empty == 0 and cnt_empty > 0:
        return ("no_response", "")
    if cnt_non_empty == 0:
        return ("no_data", None)

    if use_mode:
        return _normalize_value(str(mode_text) if mode_text is not None else None)[0:2]  # type: ignore

    if avg_num_int is not None and cnt_num >= 1:
        return ("value", str(int(avg_num_int)))

    return _normalize_value(str(mode_text) if mode_text is not None else None)[0:2]  # type: ignore


def _geojson_col(geom_col) -> ColumnElement:
    return geofunc.ST_AsGeoJSON(geofunc.ST_Transform(geom_col, 4326), maxdecimaldigits=5)


def _numeric_regex_col() -> ColumnElement:
    # Postgres regex
    return Answer.value.op("~")(r"^[+-]?\d+(\.\d+)?$")


def _best_commune_map_for_requested_cte_window(
    *,
    requested_communes_cte,  # cte avec colonne .c.gid
    target_year: int,
    year_window: int = 1,  # +-1 par défaut
) -> ColumnElement:
    """
    Retourne cm_best(unit_uid, geometry, map_year) uniquement
    pour les communes présentes dans requested_communes_cte,
    ET uniquement pour CommuneMap.year dans [target_year-year_window, target_year+year_window].

    Si une commune n'a aucune géo dans cette fenêtre, elle n'apparaît pas (pas de feature).
    """
    y_min = target_year - year_window
    y_max = target_year + year_window

    cm_ranked = (
        select(
            CommuneMap.commune_uid.label("unit_uid"),
            CommuneMap.geometry.label("geometry"),
            CommuneMap.year.label("map_year"),
            func.row_number()
            .over(
                partition_by=CommuneMap.commune_uid,
                order_by=[
                    func.abs(CommuneMap.year - target_year).asc(),  # le plus proche dans la fenêtre
                    case((CommuneMap.year <= target_year, 0), else_=1).asc(),  # tie => passé
                    CommuneMap.year.desc(),
                ],
            )
            .label("rn"),
        )
        .select_from(CommuneMap)
        .join(requested_communes_cte, requested_communes_cte.c.gid == CommuneMap.commune_uid)
        .where(and_(CommuneMap.year >= y_min, CommuneMap.year <= y_max))
    ).cte("cm_ranked_window")

    cm_best = (select(cm_ranked.c.unit_uid, cm_ranked.c.geometry, cm_ranked.c.map_year).where(cm_ranked.c.rn == 1)).cte(
        "cm_best_window"
    )

    return cm_best


def _special_dominates(cnt_null: int, cnt_empty: int, top_real_count: int) -> bool:
    """
    True si (NULL + vides) > (meilleure vraie valeur non-vide).
    """
    # TODO: utiliser plus tard pour détecter si les reponse doivent etre couleur special car egaliter ou reponse null dominent
    return (cnt_null + cnt_empty) > top_real_count


async def _global_special_stats(db: "AsyncSession", q_uid: int, year: int) -> dict[str, int | bool]:
    """
    Stats 'special' (federal/global):
      - cnt_null
      - cnt_empty (vides / espaces)
      - top_real_count: meilleure fréquence d'une vraie valeur non vide
      - special_dominant: (null+empty) > top_real_count
    """
    vtrim = func.btrim(Answer.value)

    cnt_null_stmt = (
        select(func.count())
        .select_from(Answer)
        .where(
            Answer.question_uid == q_uid,
            Answer.year == year,
            Answer.value.is_(None),
        )
    )

    cnt_empty_stmt = (
        select(func.count())
        .select_from(Answer)
        .where(
            Answer.question_uid == q_uid,
            Answer.year == year,
            Answer.value.isnot(None),
            vtrim == "",
        )
    )

    top_real_stmt = (
        select(func.count().label("n"))
        .select_from(Answer)
        .where(
            Answer.question_uid == q_uid,
            Answer.year == year,
            Answer.value.isnot(None),
            vtrim != "",
        )
        .group_by(vtrim)
        .order_by(func.count().desc())
        .limit(1)
    )

    cnt_null = int((await db.execute(cnt_null_stmt)).scalar_one() or 0)
    cnt_empty = int((await db.execute(cnt_empty_stmt)).scalar_one() or 0)
    top_real_count = int((await db.execute(top_real_stmt)).scalar_one_or_none() or 0)

    return {
        "cnt_null": cnt_null,
        "cnt_empty": cnt_empty,
        "top_real_count": top_real_count,
        "special_dominant": _special_dominates(cnt_null, cnt_empty, top_real_count),
    }


def _agg_cte_generic(
    *,
    q_uid: int,
    year: int,
    gid_col: ColumnElement,  # ex: Answer.commune_uid / Commune.district_uid / District.canton_uid
    from_clause: FromClause,  # ex: Answer / Answer.join(Commune, ...) / Answer.join(Commune,...).join(District,...)
    gid_not_null_filter: ColumnElement,  # ex: Answer.commune_uid.isnot(None) / Commune.district_uid.isnot(None) ...
    cte_prefix: str,  # ex: "commune" / "district" / "canton"
) -> Any:
    vtrim = func.btrim(Answer.value)
    is_num = _numeric_regex_col()

    avg_numeric = func.avg(cast(Answer.value, Numeric)).filter(and_(Answer.value.isnot(None), vtrim != "", is_num))

    # counts par (gid, valeur réelle non vide)
    counts = (
        select(
            gid_col.label("gid"),
            vtrim.label("v"),
            func.count().label("n"),
        )
        .select_from(from_clause)
        .where(
            Answer.question_uid == q_uid,
            Answer.year == year,
            gid_not_null_filter,
            Answer.value.isnot(None),
            vtrim != "",
        )
        .group_by(gid_col, vtrim)
    ).cte(f"{cte_prefix}_value_counts")

    # top_real_count par gid
    top = (
        select(
            counts.c.gid,
            func.max(counts.c.n).label("top_real_count"),
        ).group_by(counts.c.gid)
    ).cte(f"{cte_prefix}_top_real_count")

    # agg global par gid (inclut NULL et empty)
    agg = (
        select(
            gid_col.label("gid"),
            func.count().label("total_rows"),
            func.count().filter(Answer.value.is_(None)).label("cnt_null"),
            func.count().filter(and_(Answer.value.isnot(None), vtrim == "")).label("cnt_empty"),
            func.count().filter(and_(Answer.value.isnot(None), vtrim != "")).label("cnt_non_empty"),
            func.count().filter(and_(Answer.value.isnot(None), vtrim != "", is_num)).label("cnt_num"),
            cast(func.round(avg_numeric, 0), Integer).label("avg_num_int"),
            func.mode().within_group(vtrim).filter(and_(Answer.value.isnot(None), vtrim != "")).label("mode_text"),
            func.coalesce(top.c.top_real_count, 0).label("top_real_count"),
        )
        .select_from(from_clause)
        .outerjoin(top, top.c.gid == gid_col)
        .where(
            Answer.question_uid == q_uid,
            Answer.year == year,
            gid_not_null_filter,
        )
        .group_by(gid_col, top.c.top_real_count)
    ).cte(f"{cte_prefix}_agg")

    return agg


def _commune_agg_cte(q_uid: int, year: int) -> Any:
    return _agg_cte_generic(
        q_uid=q_uid,
        year=year,
        gid_col=Answer.commune_uid,
        from_clause=Answer.__table__,
        gid_not_null_filter=Answer.commune_uid.isnot(None),
        cte_prefix="commune",
    )


def _district_agg_cte(q_uid: int, year: int) -> Any:
    base = Answer.__table__.join(Commune.__table__, Commune.uid == Answer.commune_uid)
    return _agg_cte_generic(
        q_uid=q_uid,
        year=year,
        gid_col=Commune.district_uid,
        from_clause=base,
        gid_not_null_filter=Commune.district_uid.isnot(None),
        cte_prefix="district",
    )


def _canton_agg_cte(q_uid: int, year: int) -> Any:
    base = Answer.__table__.join(Commune.__table__, Commune.uid == Answer.commune_uid).join(
        District.__table__, District.uid == Commune.district_uid
    )
    return _agg_cte_generic(
        q_uid=q_uid,
        year=year,
        gid_col=District.canton_uid,
        from_clause=base,
        gid_not_null_filter=District.canton_uid.isnot(None),
        cte_prefix="canton",
    )


def _add_warning(
    years_meta: dict[str, Any], *, code: str, message: str, q_uid: int, year: int, granularity: str
) -> None:
    warnings = years_meta.get("warnings")
    if not isinstance(warnings, list):
        years_meta["warnings"] = []
    years_meta["warnings"].append(
        {
            "code": code,
            "message": message,
            "q_uid": q_uid,
            "year": year,
            "granularity": granularity,
        }
    )


def _empty_return(years_meta: dict[str, Any]) -> tuple["FeatureCollection", "MapLegend", dict[str, Any]]:
    # Une légende minimale qui explique "No data"
    legend = MapLegend(
        type="categorical",
        title="Responses",
        items=[LegendItem(label="No data", color=NO_DATA_COLOR, value=None)],
    )
    return FeatureCollection(features=[]), legend, years_meta


def _agg_cols(agg: Any) -> list[Any]:
    return [
        agg.c.cnt_null,
        agg.c.cnt_empty,
        agg.c.cnt_non_empty,
        agg.c.cnt_num,
        agg.c.avg_num_int,
        agg.c.mode_text,
        agg.c.top_real_count,
    ]


# boucle rows -> feats unique (commune/district/canton)
def _rows_to_features(
    *,
    level: str,
    rows: list[dict[str, Any]],
    use_mode: bool,
    include_geo_year_used: bool,
) -> list["Feature"]:
    feats: list[Feature] = []
    for r in rows:
        if r.get("geojson") is None:
            continue

        gj = json.loads(r["geojson"])

        cnt_null = int(r.get("cnt_null") or 0)
        cnt_empty = int(r.get("cnt_empty") or 0)
        top_real_count = int(r.get("top_real_count") or 0)

        kind, val = _pick_aggregated_value(
            cnt_empty=cnt_empty,
            cnt_null=cnt_null,
            cnt_non_empty=int(r.get("cnt_non_empty") or 0),
            cnt_num=int(r.get("cnt_num") or 0),
            avg_num_int=r.get("avg_num_int"),
            mode_text=r.get("mode_text"),
            use_mode=use_mode,
        )

        props: dict[str, Any] = {
            "level": level,
            "unit_uid": int(r["uid"]),
            "name": r["name"],
            "code": r["code"],
            "value_kind": kind,
            "value": val,
            "special_dominant": _special_dominates(cnt_null, cnt_empty, top_real_count),
            "top_real_count": top_real_count,
            "cnt_null": cnt_null,
            "cnt_empty": cnt_empty,
        }

        if include_geo_year_used:
            props["geo_year_used"] = int(r["geo_year_used"]) if r.get("geo_year_used") is not None else None

        feats.append(Feature(geometry=Geometry(**gj), properties=props))

    return feats


# stmt générique pour district/canton
def _stmt_admin_level(
    *,
    agg: Any,
    unit_model: Any,  # District ou Canton
    map_model: Any,  # DistrictMap ou CantonMap
    map_year: int,
    map_join_cond: Any,  # condition join map_model -> unit_model
) -> Any:
    return (
        select(
            unit_model.uid.label("uid"),
            unit_model.name.label("name"),
            unit_model.code.label("code"),
            _geojson_col(map_model.geometry).label("geojson"),
            *_agg_cols(agg),
        )
        .select_from(agg)
        .join(unit_model, unit_model.uid == agg.c.gid)
        .join(map_model, and_(map_join_cond, map_model.year == map_year))
    )


async def build_choropleth(
    db: "AsyncSession",
    scope: str,
    question_uid: int,
    year: int,
    granularity: "ChoroplethGranularity",
) -> tuple["FeatureCollection", "MapLegend", dict[str, Any]]:

    years_meta: dict[str, Any] = {"communes": None, "districts": None, "cantons": None}

    # scope global: question_uid = question_global_uid
    if scope == "global":
        resolved = await _resolve_question_per_survey_uid_for_global(db, question_uid, year)
        if resolved is None:
            _add_warning(
                years_meta,
                code="NO_QPS_FOR_GLOBAL",
                message=f"No QuestionPerSurvey found for global question_uid={question_uid} year={year}.",
                q_uid=question_uid,
                year=year,
                granularity=str(granularity),
            )
            return _empty_return(years_meta)
        q_uid = resolved
    else:
        q_uid = question_uid

    distinct_cnt = await _global_distinct_non_empty_count(db, q_uid, year)
    use_mode = distinct_cnt <= MAX_MODE_DISTINCT

    # Commune
    if granularity == "commune":
        years_meta["communes"] = year

        commune_agg = _commune_agg_cte(q_uid=q_uid, year=year)
        cm_best = _best_commune_map_for_requested_cte_window(
            requested_communes_cte=commune_agg,
            target_year=year,
            year_window=1,
        )

        communes_requested = int((await db.execute(select(func.count()).select_from(commune_agg))).scalar_one() or 0)
        communes_with_geo = int((await db.execute(select(func.count()).select_from(cm_best))).scalar_one() or 0)

        if communes_requested == 0:
            _add_warning(
                years_meta,
                code="NO_ANSWERS",
                message=f"No answers for question_uid={q_uid} year={year} (commune).",
                q_uid=q_uid,
                year=year,
                granularity="commune",
            )
            return _empty_return(years_meta)

        if communes_with_geo == 0:
            _add_warning(
                years_meta,
                code="NO_GEO_FOR_REQUESTED",
                message=f"Answers exist but no commune geometry found in window +/-2 for question_uid={q_uid} year={year}.",
                q_uid=q_uid,
                year=year,
                granularity="commune",
            )
            return _empty_return(years_meta)

        stmt = (
            select(
                Commune.uid.label("uid"),
                Commune.name.label("name"),
                Commune.code.label("code"),
                cm_best.c.map_year.label("geo_year_used"),
                _geojson_col(cm_best.c.geometry).label("geojson"),
                *_agg_cols(commune_agg),
            )
            .select_from(commune_agg)
            .join(Commune, Commune.uid == commune_agg.c.gid)
            .join(cm_best, cm_best.c.unit_uid == Commune.uid)
        )

        rows = (await db.execute(stmt)).mappings().all()
        feats = _rows_to_features(
            level="commune", rows=[dict(r) for r in rows], use_mode=use_mode, include_geo_year_used=True
        )

        if not feats:
            _add_warning(
                years_meta,
                code="NO_FEATURES",
                message=f"Answers/geometries exist but produced 0 features for question_uid={q_uid} year={year} (commune).",
                q_uid=q_uid,
                year=year,
                granularity="commune",
            )
            return _empty_return(years_meta)

        legend = _build_legend_and_colors(feats)
        return FeatureCollection(features=feats), legend, years_meta

    # District
    if granularity == "district":
        y_geo = await _nearest_year_sql_window(db, DistrictMap, year, year_window=2)
        years_meta["districts"] = y_geo
        if y_geo is None:
            _add_warning(
                years_meta,
                code="NO_GEO_YEAR",
                message=f"No district geometry year available in window +/-2 for target year={year}.",
                q_uid=q_uid,
                year=year,
                granularity="district",
            )
            return _empty_return(years_meta)

        district_agg = _district_agg_cte(q_uid=q_uid, year=year)
        district_requested = int((await db.execute(select(func.count()).select_from(district_agg))).scalar_one() or 0)
        if district_requested == 0:
            _add_warning(
                years_meta,
                code="NO_ANSWERS",
                message=f"No answers for question_uid={q_uid} year={year} (district).",
                q_uid=q_uid,
                year=year,
                granularity="district",
            )
            return _empty_return(years_meta)

        stmt = _stmt_admin_level(
            agg=district_agg,
            unit_model=District,
            map_model=DistrictMap,
            map_year=y_geo,
            map_join_cond=(DistrictMap.district_id == District.uid),
        )

        rows = (await db.execute(stmt)).mappings().all()
        feats = _rows_to_features(
            level="district", rows=[dict(r) for r in rows], use_mode=use_mode, include_geo_year_used=False
        )

        if not feats:
            _add_warning(
                years_meta,
                code="NO_FEATURES",
                message=f"Produced 0 features for question_uid={q_uid} year={year} (district).",
                q_uid=q_uid,
                year=year,
                granularity="district",
            )
            return _empty_return(years_meta)

        legend = _build_legend_and_colors(feats)
        return FeatureCollection(features=feats), legend, years_meta

    # Canton
    if granularity == "canton":
        y_geo = await _nearest_year_sql_window(db, CantonMap, year, year_window=2)
        years_meta["cantons"] = y_geo
        if y_geo is None:
            _add_warning(
                years_meta,
                code="NO_GEO_YEAR",
                message=f"No canton geometry year available in window +/-2 for target year={year}.",
                q_uid=q_uid,
                year=year,
                granularity="canton",
            )
            return _empty_return(years_meta)

        canton_agg = _canton_agg_cte(q_uid=q_uid, year=year)
        canton_requested = int((await db.execute(select(func.count()).select_from(canton_agg))).scalar_one() or 0)
        if canton_requested == 0:
            _add_warning(
                years_meta,
                code="NO_ANSWERS",
                message=f"No answers for question_uid={q_uid} year={year} (canton).",
                q_uid=q_uid,
                year=year,
                granularity="canton",
            )
            return _empty_return(years_meta)

        stmt = _stmt_admin_level(
            agg=canton_agg,
            unit_model=Canton,
            map_model=CantonMap,
            map_year=y_geo,
            map_join_cond=(CantonMap.canton_uid == Canton.uid),
        )

        rows = (await db.execute(stmt)).mappings().all()
        feats = _rows_to_features(
            level="canton", rows=[dict(r) for r in rows], use_mode=use_mode, include_geo_year_used=False
        )

        if not feats:
            _add_warning(
                years_meta,
                code="NO_FEATURES",
                message=f"Produced 0 features for question_uid={q_uid} year={year} (canton).",
                q_uid=q_uid,
                year=year,
                granularity="canton",
            )
            return _empty_return(years_meta)

        legend = _build_legend_and_colors(feats)
        return FeatureCollection(features=feats), legend, years_meta

    # Federal
    if granularity == "federal":
        y_geo = await _nearest_year_sql_window(db, CantonMap, year, year_window=2)
        years_meta["cantons"] = y_geo
        if y_geo is None:
            _add_warning(
                years_meta,
                code="NO_GEO_YEAR",
                message=f"No canton geometry year available (nearest) for target year={year}.",
                q_uid=q_uid,
                year=year,
                granularity="federal",
            )
            return _empty_return(years_meta)

        # si aucune answer => on avertit direct
        total_rows = int(
            (
                await db.execute(
                    select(func.count()).select_from(Answer).where(Answer.question_uid == q_uid, Answer.year == year)
                )
            ).scalar_one()
            or 0
        )

        if total_rows == 0:
            _add_warning(
                years_meta,
                code="NO_ANSWERS",
                message=f"No answers for question_uid={q_uid} year={year} (federal).",
                q_uid=q_uid,
                year=year,
                granularity="federal",
            )
            return _empty_return(years_meta)

        global_kind, global_val = await _compute_global_value(db, q_uid, year, use_mode=use_mode)
        special = await _global_special_stats(db, q_uid, year)

        stmt = (
            select(
                Canton.uid.label("uid"),
                Canton.name.label("name"),
                Canton.code.label("code"),
                _geojson_col(CantonMap.geometry).label("geojson"),
            )
            .select_from(Canton)
            .join(CantonMap, and_(CantonMap.canton_uid == Canton.uid, CantonMap.year == y_geo))
        )

        rows = (await db.execute(stmt)).mappings().all()

        feats: list[Feature] = []
        for r in rows:
            gj = json.loads(r["geojson"])
            feats.append(
                Feature(
                    geometry=Geometry(**gj),
                    properties={
                        "level": "federal",
                        "unit_uid": int(r["uid"]),
                        "name": r["name"],
                        "code": r["code"],
                        "value_kind": global_kind,
                        "value": global_val,
                        "special_dominant": bool(special["special_dominant"]),
                        "top_real_count": int(special["top_real_count"]),
                        "cnt_null": int(special["cnt_null"]),
                        "cnt_empty": int(special["cnt_empty"]),
                    },
                )
            )

        if not feats:
            _add_warning(
                years_meta,
                code="NO_FEATURES",
                message=f"Produced 0 features for question_uid={q_uid} year={year} (federal).",
                q_uid=q_uid,
                year=year,
                granularity="federal",
            )
            return _empty_return(years_meta)

        legend = _build_legend_and_colors(feats)
        return FeatureCollection(features=feats), legend, years_meta

    # fallback
    _add_warning(
        years_meta,
        code="INVALID_GRANULARITY",
        message=f"Unsupported granularity={granularity}.",
        q_uid=q_uid,
        year=year,
        granularity=str(granularity),
    )
    return _empty_return(years_meta)
