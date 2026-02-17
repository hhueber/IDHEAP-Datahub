from typing import Optional
import json


from app.models.answer import Answer
from app.models.canton import Canton
from app.models.canton_map import CantonMap
from app.models.commune import Commune
from app.models.commune_map import CommuneMap
from app.models.country import Country
from app.models.district import District
from app.models.district_map import DistrictMap
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from app.schemas.choropleth import ChoroplethGranularity, GradientMeta, LegendItem, MapLegend
from app.schemas.geo import Feature, FeatureCollection, Geometry
from geoalchemy2 import functions as geofunc
from sqlalchemy import and_, asc, case, cast, desc, func, Integer, Numeric, select
from sqlalchemy.ext.asyncio import AsyncSession


NO_DATA_COLOR = "#cccccc"  # gris
NO_RESPONSE_COLOR = "#f59e0b"  # orange/ambre
GRAD_START = "#22c55e"  # vert
GRAD_END = "#3b82f6"  # bleu


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


async def _year_exact_or_future_else_past(
    session: AsyncSession,
    model,
    year: int,
) -> Optional[int]:
    """
    Règle :
    1) année exacte si dispo
    2) sinon plus petite année STRICTEMENT > year
    3) sinon plus grande année STRICTEMENT < year
    4) sinon None
    """

    # année exacte
    stmt_exact = select(model.year).where(model.year == year).limit(1)
    exact = (await session.execute(stmt_exact)).scalar_one_or_none()
    if exact is not None:
        return int(exact)

    # future la plus proche
    stmt_future = select(model.year).where(model.year > year).order_by(model.year.asc()).limit(1)
    future = (await session.execute(stmt_future)).scalar_one_or_none()
    if future is not None:
        return int(future)

    # passé le plus proche (dernier recours)
    stmt_past = select(model.year).where(model.year < year).order_by(model.year.desc()).limit(1)
    past = (await session.execute(stmt_past)).scalar_one_or_none()
    if past is not None:
        return int(past)

    # aucune donnée
    return None


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


async def _compute_global_value(db: AsyncSession, q_uid: int, year: int):
    is_num = Answer.value.op("~")(r"^[+-]?\d+(\.\d+)?$")

    avg_numeric = func.avg(cast(Answer.value, Numeric)).filter(
        and_(Answer.value.isnot(None), func.btrim(Answer.value) != "", is_num)
    )

    stmt = select(
        func.count().filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) == "")).label("cnt_empty"),
        func.count().filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) != "")).label("cnt_non_empty"),
        func.count().filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) != "", is_num)).label("cnt_num"),
        cast(func.round(avg_numeric, 0), Integer).label("avg_num_int"),
        func.mode()
        .within_group(Answer.value)
        .filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) != ""))
        .label("mode_text"),
    ).where(Answer.question_uid == q_uid, Answer.year == year)

    r = (await db.execute(stmt)).mappings().first() or {}
    cnt_non_empty = int(r.get("cnt_non_empty") or 0)
    cnt_empty = int(r.get("cnt_empty") or 0)
    cnt_num = int(r.get("cnt_num") or 0)

    if cnt_non_empty == 0 and cnt_empty > 0:
        return ("no_response", "")
    if cnt_non_empty == 0:
        return ("no_data", None)

    if r.get("avg_num_int") is not None and cnt_num >= max(1, cnt_non_empty // 2):
        return ("value", str(int(r["avg_num_int"])))

    mt = r.get("mode_text")
    if mt is None:
        return ("no_data", None)
    return _normalize_value(str(mt))


async def _max_year_leq(session: AsyncSession, model, y: int) -> Optional[int]:
    q = select(func.max(model.year)).where(model.year <= y)
    res = await session.execute(q)
    v = res.scalar_one_or_none()
    return int(v) if v is not None else None


def _build_legend_and_colors(features: list[Feature]) -> MapLegend:
    MAX_CATEGORIES = 10

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

    # categorical
    if 0 < n_distinct <= MAX_CATEGORIES:
        colors = _default_colors(n_distinct)
        items = [LegendItem(label=str(v), color=colors[i], value=v) for i, v in enumerate(distinct)]
        _append_special(items)
        legend = MapLegend(type="categorical", title="Responses", items=items)
        cmap = {str(v): colors[i] for i, v in enumerate(distinct)}
        _apply_fill_colors(features, legend, categorical_map=cmap, vmin=None, vmax=None)
        return legend

    # gradient
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
                start=GRAD_START, end=GRAD_END, vmin=vmin, vmax=vmax, ticks=[float(x) for x in _make_ticks(vmin, vmax)]
            ),
        )
        _apply_fill_colors(features, legend, categorical_map=None, vmin=vmin, vmax=vmax)
        return legend

    # top10 + other
    top = distinct[:MAX_CATEGORIES]
    colors = _default_colors(len(top))
    items = [LegendItem(label=str(v), color=colors[i], value=v) for i, v in enumerate(top)]
    if n_distinct > MAX_CATEGORIES:
        items.append(LegendItem(label="Other", color="#999999", value="__other__"))
    _append_special(items)

    legend = MapLegend(type="categorical", title="Responses", items=items)
    cmap = {str(v): colors[i] for i, v in enumerate(top)}
    cmap["__other__"] = "#999999"

    # applique "Other"
    for f in features:
        if f.properties.get("value_kind") == "value":
            v = f.properties.get("value")
            if v is not None and v not in cmap:
                f.properties["value"] = "__other__"

    _apply_fill_colors(features, legend, categorical_map=cmap, vmin=None, vmax=None)
    return legend


def _ranked_best_map_cte(MapModel, id_col, geom_col, year_col, target_year: int, cte_name: str):
    ranked = (
        select(
            id_col.label("unit_uid"),
            geom_col.label("geometry"),
            year_col.label("map_year"),
            func.row_number()
            .over(
                partition_by=id_col,
                order_by=[
                    asc(case((year_col >= target_year, 0), else_=1)),
                    asc(case((year_col >= target_year, year_col), else_=None)),
                    desc(case((year_col < target_year, year_col), else_=None)),
                ],
            )
            .label("rn"),
        )
    ).cte(f"{cte_name}_ranked")

    best = (select(ranked.c.unit_uid, ranked.c.geometry, ranked.c.map_year).where(ranked.c.rn == 1)).cte(
        f"{cte_name}_best"
    )

    return best


async def build_choropleth(
    db: AsyncSession,
    scope: str,
    question_uid: int,
    year: int,
    granularity: ChoroplethGranularity,
) -> tuple[FeatureCollection, MapLegend, dict[str, Optional[int]]]:
    years_meta: dict[str, Optional[int]] = {"communes": None, "districts": None, "cantons": None}

    # resolve q_uid si scope global
    if scope == "global":
        resolved = await _resolve_question_per_survey_uid_for_global(db, question_uid, year)
        if resolved is None:
            fc = FeatureCollection(features=[])
            legend = MapLegend(type="categorical", title="Responses", items=[])
            return fc, legend, years_meta
        q_uid = resolved
    else:
        q_uid = question_uid

    # Regex numeric (Postgres)
    is_num = Answer.value.op("~")(r"^[+-]?\d+(\.\d+)?$")

    # Commune
    if granularity == "commune":
        y_geo = await _year_exact_or_future_else_past(db, CommuneMap, year)
        years_meta["communes"] = y_geo

        if y_geo is None:
            fc = FeatureCollection(features=[])
            legend = MapLegend(type="categorical", title="Responses", items=[])
            return fc, legend, years_meta

        cm_best = _ranked_best_map_cte(
            CommuneMap,
            CommuneMap.commune_uid,
            CommuneMap.geometry,
            CommuneMap.year,
            y_geo,
            "cm",
        )

        stmt = (
            select(
                cm_best.c.unit_uid.label("unit_uid"),
                Commune.name.label("name"),
                Commune.code.label("code"),
                geofunc.ST_AsGeoJSON(geofunc.ST_Transform(cm_best.c.geometry, 4326), maxdecimaldigits=5).label(
                    "geojson"
                ),
                Answer.value.label("raw_value"),
            )
            .join(Commune, Commune.uid == cm_best.c.unit_uid)
            .outerjoin(
                Answer,
                and_(
                    Answer.commune_uid == cm_best.c.unit_uid,
                    Answer.question_uid == q_uid,
                    Answer.year == year,
                ),
            )
        )

        rows = (await db.execute(stmt)).mappings().all()
        feats: list[Feature] = []

        for r in rows:
            gj = json.loads(r["geojson"])
            kind, val = _normalize_value(r["raw_value"])
            feats.append(
                Feature(
                    geometry=Geometry(**gj),
                    properties={
                        "level": "commune",
                        "unit_uid": int(r["unit_uid"]),
                        "name": r["name"],
                        "code": r["code"],
                        "value_kind": kind,
                        "value": val,
                    },
                )
            )

        legend = _build_legend_and_colors(feats)
        return FeatureCollection(features=feats), legend, years_meta

    # District
    if granularity == "district":
        y_geo = await _max_year_leq(db, DistrictMap, year)
        meta = {"districts": y_geo, "cantons": None}
        if y_geo is None:
            return FeatureCollection(features=[]), MapLegend(type="categorical", title="Responses", items=[]), meta

        is_num = Answer.value.op("~")(r"^[+-]?\d+(\.\d+)?$")
        avg_numeric = func.avg(cast(Answer.value, Numeric)).filter(
            and_(Answer.value.isnot(None), func.btrim(Answer.value) != "", is_num)
        )

        agg = (
            select(
                Commune.district_uid.label("district_uid"),
                func.count().filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) == "")).label("cnt_empty"),
                func.count()
                .filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) != ""))
                .label("cnt_non_empty"),
                func.count()
                .filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) != "", is_num))
                .label("cnt_num"),
                cast(func.round(avg_numeric, 0), Integer).label("avg_num_int"),
                func.mode()
                .within_group(Answer.value)
                .filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) != ""))
                .label("mode_text"),
            )
            .select_from(Commune)
            .join(Answer, Answer.commune_uid == Commune.uid)
            .where(Answer.question_uid == q_uid, Answer.year == year)
            .group_by(Commune.district_uid)
        ).cte("agg")

        stmt = (
            select(
                District.uid.label("uid"),
                District.name.label("name"),
                District.code.label("code"),
                geofunc.ST_AsGeoJSON(geofunc.ST_Transform(DistrictMap.geometry, 4326), maxdecimaldigits=5).label(
                    "geojson"
                ),
                agg.c.cnt_empty,
                agg.c.cnt_non_empty,
                agg.c.cnt_num,
                agg.c.avg_num_int,
                agg.c.mode_text,
            )
            .select_from(DistrictMap)
            .join(District, District.uid == DistrictMap.district_id)
            .outerjoin(agg, agg.c.district_uid == District.uid)
            .where(DistrictMap.year == y_geo)
        )

        rows = (await db.execute(stmt)).mappings().all()
        feats: list[Feature] = []

        for r in rows:
            gj = json.loads(r["geojson"])
            cnt_non_empty = int(r["cnt_non_empty"] or 0)
            cnt_empty = int(r["cnt_empty"] or 0)
            cnt_num = int(r["cnt_num"] or 0)

            if cnt_non_empty == 0 and cnt_empty > 0:
                kind, val = ("no_response", "")
            elif cnt_non_empty == 0:
                kind, val = ("no_data", None)
            else:
                if r["avg_num_int"] is not None and cnt_num >= max(1, cnt_non_empty // 2):
                    kind, val = ("value", str(int(r["avg_num_int"])))
                else:
                    kind, val = (
                        _normalize_value(str(r["mode_text"])) if r["mode_text"] is not None else ("no_data", None)
                    )

            feats.append(
                Feature(
                    geometry=Geometry(**gj),
                    properties={
                        "level": "district",
                        "unit_uid": int(r["uid"]),
                        "name": r["name"],
                        "code": r["code"],
                        "value_kind": kind,
                        "value": val,
                    },
                )
            )

        legend = _build_legend_and_colors(feats)
        return FeatureCollection(features=feats), legend, meta

    # Canton
    if granularity == "canton":
        y_geo = await _max_year_leq(db, CantonMap, year)
        meta = {"districts": None, "cantons": y_geo}
        if y_geo is None:
            return FeatureCollection(features=[]), MapLegend(type="categorical", title="Responses", items=[]), meta

        is_num = Answer.value.op("~")(r"^[+-]?\d+(\.\d+)?$")
        avg_numeric = func.avg(cast(Answer.value, Numeric)).filter(
            and_(Answer.value.isnot(None), func.btrim(Answer.value) != "", is_num)
        )

        agg = (
            select(
                District.canton_uid.label("canton_uid"),
                func.count().filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) == "")).label("cnt_empty"),
                func.count()
                .filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) != ""))
                .label("cnt_non_empty"),
                func.count()
                .filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) != "", is_num))
                .label("cnt_num"),
                cast(func.round(avg_numeric, 0), Integer).label("avg_num_int"),
                func.mode()
                .within_group(Answer.value)
                .filter(and_(Answer.value.isnot(None), func.btrim(Answer.value) != ""))
                .label("mode_text"),
            )
            .select_from(Commune)
            .join(District, District.uid == Commune.district_uid)
            .join(Answer, Answer.commune_uid == Commune.uid)
            .where(Answer.question_uid == q_uid, Answer.year == year)
            .group_by(District.canton_uid)
        ).cte("agg")

        stmt = (
            select(
                Canton.uid.label("uid"),
                Canton.name.label("name"),
                Canton.code.label("code"),
                geofunc.ST_AsGeoJSON(geofunc.ST_Transform(CantonMap.geometry, 4326), maxdecimaldigits=5).label(
                    "geojson"
                ),
                agg.c.cnt_empty,
                agg.c.cnt_non_empty,
                agg.c.cnt_num,
                agg.c.avg_num_int,
                agg.c.mode_text,
            )
            .select_from(CantonMap)
            .join(Canton, Canton.uid == CantonMap.canton_uid)
            .outerjoin(agg, agg.c.canton_uid == Canton.uid)
            .where(CantonMap.year == y_geo)
        )

        rows = (await db.execute(stmt)).mappings().all()
        feats: list[Feature] = []

        for r in rows:
            gj = json.loads(r["geojson"])
            cnt_non_empty = int(r["cnt_non_empty"] or 0)
            cnt_empty = int(r["cnt_empty"] or 0)
            cnt_num = int(r["cnt_num"] or 0)

            if cnt_non_empty == 0 and cnt_empty > 0:
                kind, val = ("no_response", "")
            elif cnt_non_empty == 0:
                kind, val = ("no_data", None)
            else:
                if r["avg_num_int"] is not None and cnt_num >= max(1, cnt_non_empty // 2):
                    kind, val = ("value", str(int(r["avg_num_int"])))
                else:
                    kind, val = (
                        _normalize_value(str(r["mode_text"])) if r["mode_text"] is not None else ("no_data", None)
                    )

            feats.append(
                Feature(
                    geometry=Geometry(**gj),
                    properties={
                        "level": "canton",
                        "unit_uid": int(r["uid"]),
                        "name": r["name"],
                        "code": r["code"],
                        "value_kind": kind,
                        "value": val,
                    },
                )
            )

        legend = _build_legend_and_colors(feats)
        return FeatureCollection(features=feats), legend, meta

    # Country
    if granularity == "federal":
        y_geo = await _max_year_leq(db, CantonMap, year)
        meta = {"districts": None, "cantons": y_geo}
        if y_geo is None:
            return FeatureCollection(features=[]), MapLegend(type="categorical", title="Responses", items=[]), meta

        global_kind, global_val = await _compute_global_value(db, q_uid, year)

        stmt = (
            select(
                Canton.uid.label("uid"),
                Canton.name.label("name"),
                Canton.code.label("code"),
                geofunc.ST_AsGeoJSON(geofunc.ST_Transform(CantonMap.geometry, 4326), maxdecimaldigits=5).label(
                    "geojson"
                ),
            )
            .select_from(CantonMap)
            .join(Canton, Canton.uid == CantonMap.canton_uid)
            .where(CantonMap.year == y_geo)
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
                    },
                )
            )

        legend = _build_legend_and_colors(feats)
        return FeatureCollection(features=feats), legend, meta

    # fallback (normalement jamais)
    fc = FeatureCollection(features=[])
    legend = MapLegend(type="categorical", title="Responses", items=[])
    return fc, legend, years_meta
