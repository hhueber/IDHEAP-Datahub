import logging


from app.models.answer import Answer
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from app.services.add_database.commune_service import add_update_geo_data, get_commune_mapping_year
from app.services.data_import.data_import_storage_service import (
    get_import_dir,
    get_workspace_dir,
    read_analysis,
    read_frame,
    read_metadata,
)
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd


logger = logging.getLogger(__name__)


async def commune(db: AsyncSession):
    await add_update_geo_data(db, 2016)


async def import_survey_to_db(db: AsyncSession, upload_id: str):
    import_dir = get_import_dir(upload_id)
    workspace_dir = get_workspace_dir(import_dir)

    analysis = read_analysis(import_dir)
    metadata = read_metadata(import_dir)

    df = read_frame(import_dir)

    detected_survey = analysis.get("detected_survey") or {}
    survey_name = detected_survey.get("name")
    survey_years = metadata.get("years")

    if not survey_name or not survey_years:
        raise ValueError("Cannot find name or survey year")

    for year in survey_years:

        result = await db.execute(select(Survey).filter_by(year=year, name=survey_name))
        db_survey = result.scalar_one_or_none()
        if not db_survey:
            db_survey = Survey(name=survey_name, year=year)
            logging.info("cc")
            db.add(db_survey)
            await db.flush()

        bfs_column_name = None
        question_columns = []

        for col in analysis.get("columns_summary", []):
            col_name = col.get("original_name")
            section = col.get("section")

            if section == "municipalities" and col.get("detected_type") == "integer":
                bfs_column_name = col_name
            elif section in {"responses", "questions"}:
                question_columns.append(col_name)

        if not bfs_column_name:
            raise ValueError("Cannot find the municipalities column")

        question_uid_map = {}
        for col_name in question_columns:
            q_code = str(col_name).strip()
            result = await db.execute(select(QuestionPerSurvey).filter_by(code=q_code))
            db_question_per_survey = result.scalar_one_or_none()

            if not db_question_per_survey:
                # TODO Remplacer par le bon label et la bonne maniere de recuperer le label
                db_question_per_survey = QuestionPerSurvey(code=q_code, label=q_code, survey=db_survey)
                db.add(db_question_per_survey)
                await db.flush()

            question_uid_map[col_name] = db_question_per_survey.uid

        commune_mapping = await get_commune_mapping_year(db, year)

        answer_to_insert = []

        for _, row in df.iterrows():
            raw_bfs = row.get(bfs_column_name)
            if pd.isna(raw_bfs) or str(raw_bfs).strip() == "":
                continue

            try:
                bfs_code = str(int(float(raw_bfs)))
            except (ValueError, TypeError):
                bfs_code = str(raw_bfs).strip()

            commune_uid = commune_mapping.get(bfs_code)
            if not commune_uid:
                continue

            for col_name in question_columns:
                val = row.get(col_name)
                if pd.isna(val) or str(val).strip() == "":
                    continue

                answer_to_insert.append(
                    {
                        "year": year,
                        "question_uid": question_uid_map[col_name],
                        "commune_uid": commune_uid,
                        "value": str(val).strip(),
                    }
                )

        chunk_size = 10000
        total_inserted = 0

        if answer_to_insert:
            stmt = pg_insert(Answer)
            upsert_stmt = stmt.on_conflict_do_update(
                index_elements=["question_uid", "commune_uid", "year"],
                set_={"value": stmt.excluded.value},
            )

            for i in range(0, len(answer_to_insert), chunk_size):
                chunk = answer_to_insert[i : i + chunk_size]
                await db.execute(upsert_stmt, chunk)
                total_inserted += len(chunk)

            await db.commit()
