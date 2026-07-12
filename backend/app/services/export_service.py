from typing import Dict, List
import csv
import io


from app.schemas.export import ExportQuestion
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# traduction propre
def get_text(row, lang: str) -> str:
    return row.get(f"text_{lang}") or row.get("label")


async def export_csv_service(
    db: AsyncSession,
    questions: List[ExportQuestion],
    lang: str,
) -> bytes:

    # séparer types
    per_survey_ids = [q.uid for q in questions if q.scope == "per_survey"]
    global_ids = [q.uid for q in questions if q.scope == "global"]

    # récupérer questions per_survey
    per_survey_map = {}
    if per_survey_ids:
        query = text(
            """
            SELECT uid, label, private,
                   text_fr, text_de, text_it, text_en, text_ro
            FROM question_per_survey
            WHERE uid = ANY(:ids)
        """
        )
        res = await db.execute(query, {"ids": per_survey_ids})
        rows = res.mappings().all()

        for r in rows:
            if not r["private"]:
                per_survey_map[r["uid"]] = r

    # récupérer global -> + leurs questions liées
    global_map = {}  # global_uid -> label
    global_to_qps = {}  # global_uid -> [qps_uid]

    if global_ids:
        query = text(
            """
            SELECT 
                g.uid AS global_uid,
                g.label,
                g.text_fr, g.text_de, g.text_it, g.text_en, g.text_ro,
                q.uid AS qps_uid,
                q.private
            FROM question_global g
            JOIN question_per_survey q 
                ON q.question_global_uid = g.uid
            WHERE g.uid = ANY(:ids)
        """
        )

        res = await db.execute(query, {"ids": global_ids})
        rows = res.mappings().all()

        for r in rows:
            if r["private"]:
                continue

            global_map[r["global_uid"]] = get_text(r, lang)

            global_to_qps.setdefault(r["global_uid"], []).append(r["qps_uid"])

    # récupérer réponses pout toutes les questions demandées (per_survey + global)
    all_qps_ids = list(per_survey_map.keys()) + [qps for lst in global_to_qps.values() for qps in lst]

    if not all_qps_ids:
        return b""

    query_answers = text(
        """
        SELECT 
            a.value,
            a.year,
            a.question_uid,
            c.name AS commune_name
        FROM answer a
        JOIN commune c ON c.uid = a.commune_uid
        WHERE a.question_uid = ANY(:ids)
    """
    )

    res = await db.execute(query_answers, {"ids": all_qps_ids})
    answers = res.mappings().all()

    # pivot: avoir une ligne par commune, une colonne par question + année
    data: Dict[str, Dict[str, str]] = {}
    columns_set = set()

    for row in answers:
        q_uid = row["question_uid"]
        year = row["year"]
        commune = row["commune_name"]

        # cas per_survey
        if q_uid in per_survey_map:
            label = get_text(per_survey_map[q_uid], lang)

        else:
            # cas global
            global_uid = None

            for g_uid, qps_list in global_to_qps.items():
                if q_uid in qps_list:
                    global_uid = g_uid
                    break

            if global_uid is None:
                continue

            label = global_map[global_uid]

        col_name = f"{label} ({year})"
        columns_set.add(col_name)

        if commune not in data:
            data[commune] = {}

        data[commune][col_name] = row["value"]

    # tri colonnes intelligent (année)
    def sort_key(col: str):
        if "(" in col:
            year = int(col.split("(")[-1].replace(")", ""))
            name = col.split("(")[0]
            return (name, year)
        return (col, 0)

    columns = sorted(columns_set, key=sort_key)

    # CSV
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")

    writer.writerow(["Commune", *columns])

    for commune in sorted(data.keys()):
        row = [commune]
        for col in columns:
            row.append(data[commune].get(col, ""))
        writer.writerow(row)

    return output.getvalue().encode("utf-8")
