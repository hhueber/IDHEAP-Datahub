from collections import Counter, defaultdict


from app.models.answer import Answer
from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.models.option import Option
from app.models.question_option_association import QuestionOptionAssociation
from app.services.choropleth_service import _resolve_question_per_survey_uid_for_global
from sqlalchemy import func, select


async def _get_question_options(db, question_uid: int) -> list[dict]:
    stmt = (
        select(Option.value, Option.label_)
        .join(QuestionOptionAssociation)
        .where(QuestionOptionAssociation.question_uid == question_uid)
    )

    rows = (await db.execute(stmt)).all()

    return [
        {
            "value": str(value),
            "label": label if label else str(value),
        }
        for value, label in rows
    ]


def _complete_distribution(distribution: list[dict], options: list[dict]) -> list[dict]:
    existing = {str(d["value"]) for d in distribution}

    for opt in options:
        if str(opt["value"]) not in existing:
            distribution.append({"value": opt["value"], "count": 0})

    def sort_key(x):
        try:
            return (0, int(x["value"]))
        except:
            return (1, str(x["value"]))

    return sorted(distribution, key=sort_key)


def _normalize_answer_value(v: str | None) -> str | None:
    if v is None:
        return None
    s = v.strip()
    if not s:
        return None
    return s


def _mode(values: list[str]) -> str | None:
    if not values:
        return None
    counts = Counter(values)
    max_count = max(counts.values())
    top_values = [k for k, c in counts.items() if c == max_count]
    # tie-break stable: ordre alphabétique / numérique en string
    return sorted(top_values)[0]


def _build_distribution(values: list[str]) -> list[dict]:
    counts = Counter(values)

    def sort_key(x: str):
        try:
            return (0, int(x))
        except Exception:
            return (1, x)

    return [{"value": k, "count": v} for k, v in sorted(counts.items(), key=lambda kv: sort_key(kv[0]))]


async def _fetch_one(db, stmt):
    res = (await db.execute(stmt)).first()
    return res


async def _count_communes_by_district(db, district_uid: int) -> int:
    stmt = select(func.count()).where(Commune.district_uid == district_uid)
    return int((await db.execute(stmt)).scalar() or 0)


async def _count_communes_by_canton(db, canton_uid: int) -> int:
    stmt = (
        select(func.count())
        .select_from(Commune)
        .join(District, District.uid == Commune.district_uid)
        .where(District.canton_uid == canton_uid)
    )
    return int((await db.execute(stmt)).scalar() or 0)


async def _get_context(db, area_uid: int, level: str) -> dict:
    if level == "commune":
        stmt = (
            select(
                Commune.name.label("commune_name"),
                District.name.label("district_name"),
                Canton.name.label("canton_name"),
                Commune.district_uid.label("district_uid"),
                District.canton_uid.label("canton_uid"),
            )
            .join(District, District.uid == Commune.district_uid)
            .join(Canton, Canton.uid == District.canton_uid)
            .where(Commune.uid == area_uid)
        )

        res = await _fetch_one(db, stmt)
        if not res:
            return {}

        return {
            "commune": res.commune_name,
            "district": res.district_name,
            "canton": res.canton_name,
            "district_uid": res.district_uid,
            "canton_uid": res.canton_uid,
        }

    if level == "district":
        stmt = (
            select(
                District.name.label("district_name"),
                Canton.name.label("canton_name"),
                District.canton_uid.label("canton_uid"),
            )
            .join(Canton, Canton.uid == District.canton_uid)
            .where(District.uid == area_uid)
        )

        res = await _fetch_one(db, stmt)
        if not res:
            return {}

        nb_communes = await _count_communes_by_district(db, area_uid)

        return {
            "district": res.district_name,
            "canton": res.canton_name,
            "canton_uid": res.canton_uid,
            "nb_communes": nb_communes,
        }

    if level == "canton":
        stmt = select(Canton.name.label("canton_name")).where(Canton.uid == area_uid)

        res = await _fetch_one(db, stmt)
        if not res:
            return {}

        nb_communes = await _count_communes_by_canton(db, area_uid)

        return {
            "canton": res.canton_name,
            "nb_communes": nb_communes,
        }

    return {}


async def _get_raw_commune_answers(db, question_uid: int, year: int) -> list[tuple[int, str]]:
    stmt = select(
        Answer.commune_uid.label("commune_uid"),
        Answer.value.label("value"),
    ).where(
        Answer.question_uid == question_uid,
        Answer.year == year,
        Answer.value.isnot(None),
        Answer.value != "",
    )
    rows = (await db.execute(stmt)).all()

    out: list[tuple[int, str]] = []
    for commune_uid, value in rows:
        norm = _normalize_answer_value(value)
        if norm is not None:
            out.append((int(commune_uid), norm))
    return out


async def _build_global_distributions(db, question_uid: int, year: int) -> dict:
    raw = await _get_raw_commune_answers(db, question_uid, year)
    if not raw:
        return {"commune": [], "district": [], "canton": []}

    # commune global: distribution directe des réponses des communes
    commune_values = [v for _, v in raw]
    commune_dist = _build_distribution(commune_values)

    # map commune -> district/canton
    stmt = select(
        Commune.uid.label("commune_uid"),
        Commune.district_uid.label("district_uid"),
        District.canton_uid.label("canton_uid"),
    ).join(District, District.uid == Commune.district_uid)
    map_rows = (await db.execute(stmt)).all()

    commune_to_district: dict[int, int] = {}
    commune_to_canton: dict[int, int] = {}
    for commune_uid, district_uid, canton_uid in map_rows:
        commune_to_district[int(commune_uid)] = int(district_uid)
        commune_to_canton[int(commune_uid)] = int(canton_uid)

    # district global: chaque district reçoit sa valeur modale, puis on distribue ces valeurs
    district_buckets: dict[int, list[str]] = defaultdict(list)
    for commune_uid, value in raw:
        district_uid = commune_to_district.get(commune_uid)
        if district_uid is not None:
            district_buckets[district_uid].append(value)

    district_modes = [_mode(vals) for vals in district_buckets.values()]
    district_values = [v for v in district_modes if v is not None]
    district_dist = _build_distribution(district_values)

    # canton global: même logique
    canton_buckets: dict[int, list[str]] = defaultdict(list)
    for commune_uid, value in raw:
        canton_uid = commune_to_canton.get(commune_uid)
        if canton_uid is not None:
            canton_buckets[canton_uid].append(value)

    canton_modes = [_mode(vals) for vals in canton_buckets.values()]
    canton_values = [v for v in canton_modes if v is not None]
    canton_dist = _build_distribution(canton_values)

    return {
        "commune": commune_dist,
        "district": district_dist,
        "canton": canton_dist,
    }


async def _get_selected_value(db, question_uid: int, year: int, area_uid: int, level: str) -> str | None:
    raw = await _get_raw_commune_answers(db, question_uid, year)
    if not raw:
        return None

    if level == "commune":
        for commune_uid, value in raw:
            if commune_uid == area_uid:
                return value
        return None

    # map commune -> district/canton
    stmt = select(
        Commune.uid.label("commune_uid"),
        Commune.district_uid.label("district_uid"),
        District.canton_uid.label("canton_uid"),
    ).join(District, District.uid == Commune.district_uid)
    map_rows = (await db.execute(stmt)).all()

    commune_to_district: dict[int, int] = {}
    commune_to_canton: dict[int, int] = {}
    for commune_uid, district_uid, canton_uid in map_rows:
        commune_to_district[int(commune_uid)] = int(district_uid)
        commune_to_canton[int(commune_uid)] = int(canton_uid)

    selected_values: list[str] = []

    if level == "district":
        for commune_uid, value in raw:
            if commune_to_district.get(commune_uid) == area_uid:
                selected_values.append(value)

    elif level == "canton":
        for commune_uid, value in raw:
            if commune_to_canton.get(commune_uid) == area_uid:
                selected_values.append(value)

    return _mode(selected_values)


async def build_area_comparison(
    db,
    scope,
    question_uid,
    year,
    area_uid,
    level,
):
    if scope == "global":
        resolved = await _resolve_question_per_survey_uid_for_global(db, question_uid, year)
        if resolved is None:
            return {"success": True, "data": None}
        question_uid = resolved

    context = await _get_context(db, area_uid, level)
    selected_value = await _get_selected_value(db, question_uid, year, area_uid, level)

    if selected_value is None:
        return {"success": True, "data": None}

    distributions = await _build_global_distributions(db, question_uid, year)

    level_distribution = distributions.get(level, [])
    total = sum(item["count"] for item in level_distribution)

    same_count = 0
    for item in level_distribution:
        if str(item["value"]) == str(selected_value):
            same_count = int(item["count"])
            break

    percentage_same = round((same_count / total) * 100, 1) if total > 0 else 0.0

    options = await _get_question_options(db, question_uid)
    if options:
        distributions["commune"] = _complete_distribution(distributions["commune"], options)
        distributions["district"] = _complete_distribution(distributions["district"], options)
        distributions["canton"] = _complete_distribution(distributions["canton"], options)

    return {
        "success": True,
        "data": {
            "value": selected_value,
            "total": total,
            "same_count": same_count,
            "percentage_same": percentage_same,
            "distribution": distributions,
            "context": context,
            "options": options,
        },
    }
