from typing import Optional, Tuple
import json
import math


from app.models.answer import Answer
from app.models.commune import Commune
from app.models.commune_map import CommuneMap
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from app.schemas.choropleth import GradientMeta, LegendItem, MapLegend
from app.schemas.geo import Feature, FeatureCollection, Geometry
from geoalchemy2 import functions as geofunc
from sqlalchemy import and_, asc, case, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func


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
    res = await session.execute(stmt_exact)
    exact = res.scalar_one_or_none()
    if exact is not None:
        return int(exact)

    # future la plus proche
    stmt_future = select(model.year).where(model.year > year).order_by(model.year.asc()).limit(1)
    res = await session.execute(stmt_future)
    future = res.scalar_one_or_none()
    if future is not None:
        return int(future)

    # passé le plus proche (dernier recours)
    stmt_past = select(model.year).where(model.year < year).order_by(model.year.desc()).limit(1)
    res = await session.execute(stmt_past)
    past = res.scalar_one_or_none()
    if past is not None:
        return int(past)

    # aucune donnée
    return None


def _apply_fill_colors(
    features: list[Feature],
    legend: MapLegend,
    *,
    categorical_value_to_color: dict[str | None, str] | None,
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

        # kind == "value"
        if legend.type == "categorical":
            if categorical_value_to_color is None:
                props["fill_color"] = NO_DATA_COLOR
            else:
                # v est un string normalisé (ou None)
                props["fill_color"] = categorical_value_to_color.get(v, "#999999")  # other fallback
            continue

        # gradient continu
        if legend.type == "gradient":
            try:
                x = float(v)
            except Exception:
                props["fill_color"] = NO_DATA_COLOR
                continue

            if vmin is None or vmax is None or vmax == vmin:
                props["fill_color"] = _interp_color(GRAD_START, GRAD_END, 0.5)
                continue

            t = (x - vmin) / (vmax - vmin)
            props["fill_color"] = _interp_color(GRAD_START, GRAD_END, t)
            continue

        props["fill_color"] = NO_DATA_COLOR


async def _resolve_question_per_survey_uid_for_global(
    db: AsyncSession,
    question_global_uid: int,
    year: int,
) -> int | None:
    stmt = (
        select(QuestionPerSurvey.uid)
        .join(Survey, Survey.uid == QuestionPerSurvey.survey_uid)
        .where(
            QuestionPerSurvey.question_global_uid == question_global_uid,
            Survey.year == year,
        )
        .limit(1)
    )
    res = await db.execute(stmt)
    uid = res.scalar_one_or_none()
    return int(uid) if uid is not None else None


def _normalize_answer_value(v: Optional[str]) -> tuple[str, Optional[str]]:
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


def _float_if_numeric(kind: str, s: Optional[str]) -> Optional[float]:
    if kind != "value" or s is None:
        return None
    try:
        return float(s)
    except Exception:
        return None


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


async def build_commune_choropleth(
    db: AsyncSession,
    scope: str,
    question_uid: int,
    year: int,
) -> tuple[FeatureCollection, MapLegend, Optional[int]]:
    """
    Construit une FeatureCollection (communes) avec properties.value = réponse,
    et une légende associée (categorical ou gradient).

    - year_geo_communes = max(CommuneMap.year <= year_requested)
    - answers filtrées strictement sur (question_uid, year_requested)
    """
    year_geo = await _year_exact_or_future_else_past(db, CommuneMap, year)

    if scope == "global":
        resolved = await _resolve_question_per_survey_uid_for_global(db, question_uid, year)
        if resolved is None:
            empty_fc = FeatureCollection(features=[])
            legend = MapLegend(type="categorical", title="Responses", items=[])
            return empty_fc, legend, year_geo
        question_per_survey_uid = resolved
    else:
        question_per_survey_uid = question_uid

    if year_geo is None:
        # Pas de géométrie disponible
        empty_fc = FeatureCollection(features=[])
        legend = MapLegend(type="categorical", title="Value", items=[])
        return empty_fc, legend, None

    # Jointure: commune geometry @ year_geo + answer @ (question_uid, year)
    target_geo_year = year_geo  # année "cible" pour la géométrie

    cm_ranked = (
        select(
            CommuneMap.commune_uid.label("commune_uid"),
            CommuneMap.geometry.label("geometry"),
            CommuneMap.year.label("cm_year"),
            func.row_number()
            .over(
                partition_by=CommuneMap.commune_uid,
                order_by=[
                    # 0 si année >= target (on préfère futur), 1 sinon
                    asc(case((CommuneMap.year >= target_geo_year, 0), else_=1)),
                    # futur: plus petite année d'abord
                    asc(case((CommuneMap.year >= target_geo_year, CommuneMap.year), else_=None)),
                    # passé: plus grande année d'abord
                    desc(case((CommuneMap.year < target_geo_year, CommuneMap.year), else_=None)),
                ],
            )
            .label("rn"),
        )
    ).cte("cm_ranked")

    cm_best = (
        select(
            cm_ranked.c.commune_uid,
            cm_ranked.c.geometry,
            cm_ranked.c.cm_year,
        ).where(cm_ranked.c.rn == 1)
    ).cte("cm_best")

    stmt = (
        select(
            cm_best.c.commune_uid.label("commune_uid"),
            Commune.name.label("name"),
            Commune.code.label("code"),
            geofunc.ST_AsGeoJSON(geofunc.ST_Transform(cm_best.c.geometry, 4326), maxdecimaldigits=5).label("geojson"),
            Answer.value.label("value"),
            cm_best.c.cm_year.label("geo_year_used"),
        )
        .join(Commune, Commune.uid == cm_best.c.commune_uid)
        .outerjoin(
            Answer,
            and_(
                Answer.commune_uid == cm_best.c.commune_uid,
                Answer.question_uid == question_per_survey_uid,
                Answer.year == year,  # <-- année demandée pour les réponses
            ),
        )
    )

    rows = (await db.execute(stmt)).mappings().all()

    features: list[Feature] = []
    raw_values: list[Optional[str]] = []
    numeric_values: list[float] = []

    for r in rows:
        gj = json.loads(r["geojson"])  # str -> dict
        raw = r["value"]
        kind, value = _normalize_answer_value(raw)

        raw_values.append((kind, value))

        v_num = _float_if_numeric(kind, value)
        if v_num is not None:
            numeric_values.append(v_num)

        feat = Feature(
            geometry=Geometry(**gj),
            properties={
                "commune_uid": int(r["commune_uid"]),
                "name": r["name"],
                "code": r["code"],
                "value": value,  # None | "" | "..."
                "value_kind": kind,  # optionnel (peut être utile)
            },
        )
        features.append(feat)

    fc = FeatureCollection(features=features)

    # LEGEND
    MAX_CATEGORIES = 10

    real_values = [v for (k, v) in raw_values if k == "value" and v is not None]
    distinct_values = sorted(set(real_values))
    n_distinct = len(distinct_values)

    has_no_response = any(k == "no_response" for (k, _) in raw_values)
    has_no_data = any(k == "no_data" for (k, _) in raw_values)

    # Détecter "principalement numérique" (utile seulement si >10 distinct)
    numeric_count = len(numeric_values)
    real_count = len(real_values)
    mostly_numeric = (real_count > 0) and (numeric_count / real_count >= 0.8)

    # Helper: ajoute items spéciaux
    def _append_special_items(items: list[LegendItem]) -> None:
        if has_no_response:
            items.append(LegendItem(label="No response", color=NO_RESPONSE_COLOR, value=""))
        if has_no_data:
            items.append(LegendItem(label="No data", color=NO_DATA_COLOR, value=None))

    # 1) <= 10 distinct => categorical (si valeurs "1/2/3")
    if n_distinct > 0 and n_distinct <= MAX_CATEGORIES:
        colors = _default_colors(n_distinct)
        items = [LegendItem(label=str(v), color=colors[i], value=v) for i, v in enumerate(distinct_values)]
        _append_special_items(items)
        legend = MapLegend(type="categorical", title="Responses", items=items)
        categorical_map = {str(v): colors[i] for i, v in enumerate(distinct_values)}
        _apply_fill_colors(features, legend, categorical_value_to_color=categorical_map, vmin=None, vmax=None)
        return fc, legend, year_geo

    # 2) > 10 distinct et principalement numérique => gradient CONTINU
    if n_distinct > MAX_CATEGORIES and mostly_numeric and numeric_values:
        vmin = float(min(numeric_values))
        vmax = float(max(numeric_values))
        ticks = _make_ticks(vmin, vmax)

        items: list[LegendItem] = []
        _append_special_items(items)

        legend = MapLegend(
            type="gradient",
            title="Value",
            items=items,
            gradient=GradientMeta(
                start=GRAD_START,
                end=GRAD_END,
                vmin=vmin,
                vmax=vmax,
                ticks=[float(x) for x in ticks],
            ),
        )
        _apply_fill_colors(features, legend, categorical_value_to_color=None, vmin=vmin, vmax=vmax)
        return fc, legend, year_geo

    # 3) >10 distinct mais pas numérique => top10 + Other
    top = distinct_values[:MAX_CATEGORIES]
    colors = _default_colors(len(top))
    items = [LegendItem(label=str(v), color=colors[i], value=v) for i, v in enumerate(top)]
    if n_distinct > MAX_CATEGORIES:
        items.append(LegendItem(label="Other", color="#999999", value="__other__"))

    _append_special_items(items)
    legend = MapLegend(type="categorical", title="Responses", items=items)
    top_map = {str(v): colors[i] for i, v in enumerate(top)}
    top_map["__other__"] = "#999999"

    _apply_fill_colors(features, legend, categorical_value_to_color=top_map, vmin=None, vmax=None)
    return fc, legend, year_geo
