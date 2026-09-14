import logging


from app.models.answer import Answer
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from app.schemas.data_import import ImportRoleEnum
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


async def import_new_survey_pipeline(db: AsyncSession, upload_id: str):
    await import_survey_to_db(db, upload_id)


async def import_survey_to_db(db: AsyncSession, upload_id: str):
    import_dir = get_import_dir(upload_id)
    workspace_dir = get_workspace_dir(import_dir)

    analysis = read_analysis(import_dir)
    metadata = read_metadata(import_dir)

    df = read_frame(import_dir)

    detected_survey = analysis.get("detected_survey") or {}
    survey_name = metadata.get("display_name")
    years = metadata.get("years")

    if not survey_name or not years:
        raise ValueError("Cannot find name or survey year")

    await add_update_geo_data(db, years)

    for year in years:
        result = await db.execute(select(Survey).filter_by(year=year, name="hab" + str(year)))
        db_survey = result.scalar_one_or_none()
        if not db_survey:
            db_survey = Survey(name=survey_name, year=year)
            db.add(db_survey)
            print("Aded")
            await db.flush()

        bfs_column_name = None
        question_columns = []
        answer_columns = []
        question_role_map = {}

        for col in analysis.get("columns_summary", []):
            col_name = col.get("original_name")
            section = col.get("section")

            if section == "municipalities" and col.get("detected_type") == "integer":
                bfs_column_name = col_name
            elif section == "questions":
                question_columns.append(col_name)
                role: ImportRoleEnum = col.get("role")
                print(f"role = {role}")
                if role in ImportRoleEnum:
                    question_role_map[role] = col_name
            elif section == "responses":
                answer_columns.append(col_name)

        if not bfs_column_name:
            raise ValueError(
                "Cannot find the municipalities column"
            )  # TODO: Pouvoir mieux gerer les erreurs afin de les envoyer a l'utilisateur

        result = await db.execute(select(QuestionPerSurvey))
        questions = result.scalars().all()

        question_mapping_insert = {}
        for question in questions:
            question_mapping_insert.setdefault(question.code, question)

        for _, row in df.iterrows():
            if row[question_role_map["code"]] != "":
                if int(row[question_role_map["year"]]) != int(db_survey.year):
                    continue
                if row[question_role_map["code"]] not in question_mapping_insert:
                    db_question_per_survey = QuestionPerSurvey(
                        code=row[question_role_map["code"]], label=row[question_role_map["label"]], survey=db_survey
                    )
                    question_mapping_insert[db_question_per_survey.code] = db_question_per_survey
                    db.add(db_question_per_survey)
                    await db.flush()

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

            for col_name in answer_columns:
                print(col_name)
                val = row.get(col_name)
                if pd.isna(val) or str(val).strip() == "":
                    continue

                answer_to_insert.append(
                    {
                        "year": year,
                        "question_uid": question_mapping_insert[col_name].uid,
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
