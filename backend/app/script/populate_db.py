from app.data.cantons import CANTONS
from app.db import SessionLocal
from app.models import QuestionGlobal
from app.models.answer import Answer
from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.models.question_category import QuestionCategory
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from sqlalchemy import select
import pandas as pd


""""
Script for populate the database.

All the data will be from the folder ./Data
"""


async def populate_db() -> None:
    async with SessionLocal() as session:

        # Add canton
        async with session.begin():
            index = 1
            total_item = len(CANTONS)
            for code, lang in CANTONS.items():
                db_canton = Canton(
                    code=code,
                    ofs_id=lang["ofs_id"],
                    name=lang["en"],
                    name_de=lang["de"],
                    name_en=lang["en"],
                    name_fr=lang["fr"],
                    name_it=lang["it"],
                    name_ro=lang["ro"],
                )
                print(f">>> CREATING {index}/{total_item} {db_canton.name}")
                index += 1

                session.add(db_canton)
                await session.flush()

                # Creating fake district for commune who dont have any district
                # They can be recognised with their code being the canton code
                db_district = District(code=code, name=code, canton=db_canton)
                session.add(db_district)
                await session.flush()

        # District and commune
        row_number = 0
        async with session.begin():

            communes = pd.read_excel("./app/data/EtatCommunes.xlsx", index_col=4, header=0)
            communes["Canton"] = communes["Canton"].apply(lambda x: "CH-" + x if isinstance(x, str) else None)
            communes["Numéro du district"] = communes["Numéro du district"].apply(lambda x: "B" + str(x).zfill(4))

            for index, rows in communes.iterrows():
                result = await session.execute(select(Canton).filter_by(code=rows["Canton"]))
                db_canton = result.scalar_one_or_none()

                if db_canton is None:
                    RuntimeError("Canton not found, good luck")

                result = await session.execute(select(District).filter_by(name=rows["Nom du district"]))
                db_district = result.scalar_one_or_none()
                if db_district is not None:
                    print(">>> District already exists")
                else:
                    db_district = District(
                        code=rows["Numéro du district"],
                        name=rows["Nom du district"],
                        name_en=rows["Nom du district"],
                        name_fr=rows["Nom du district"],
                        name_it=rows["Nom du district"],
                        name_ro=rows["Nom du district"],
                        name_de=rows["Nom du district"],
                        canton=db_canton,
                    )
                    print(f">>> INSERTING DISTRICT {db_district.name}")
                    session.add(db_district)
                    await session.flush()

                db_commune = Commune(
                    code=str(index),
                    name=rows["Nom de la commune"],
                    name_en=rows["Nom de la commune"],
                    name_fr=rows["Nom de la commune"],
                    name_it=rows["Nom de la commune"],
                    name_ro=rows["Nom de la commune"],
                    name_de=rows["Nom de la commune"],
                    district=db_district,
                )
                session.add(db_commune)
                await session.flush()
                row_number += 1
                print(f">>> INSERTING COMMUNE {rows["Nom de la commune"]} {row_number}/{len(communes)} ")

        # Survey and question per survey
        async with session.begin():
            for year in [1988, 1994, 1998, 2005, 2009, 2017, 2023]:

                db_survey = Survey(
                    name=f"GSB{str(year)[2:]}",
                    year=year,
                )
                session.add(db_survey)
                await session.flush()
                print(f">> Inserting survey {year}")

                gsb = pd.read_excel(
                    "./app/data/CodeBook_Cleaned.xlsx",
                    sheet_name=str(year),
                    index_col=1,
                    header=0,
                )
                for index, row in gsb.iterrows():
                    db_question = QuestionPerSurvey(
                        code=str(index),
                        label=row["label"],
                        survey=db_survey,
                        text_de=row["text_de"],
                        text_en=str(row["text_en"]),
                        text_fr=str(row["text_fr"]),
                        text_it=str(row["text_it"]),
                        text_ro=str(row["text_ro"]),
                    )
                    session.add(db_question)
                    await session.flush()
                    print(f">>> INSERTING QUESTION {str(index)}")

        # Global question and categories
        async with session.begin():
            gbd = pd.read_csv("./app/data/QuestionsGlobales.csv", index_col=None, header=0)

            for index, row in gbd.iterrows():
                if not pd.isnull(row["category_label"]):
                    db_question_category = QuestionCategory(
                        label=row["category_label"],
                        text_de=row["category_text_de"],
                        text_en=row["category_text_en"],
                        text_fr=row["category_text_fr"],
                        text_it=row["category_text_it"],
                        text_ro=row["category_text_ro"],
                    )

                    session.add(db_question_category)
                    await session.flush()
                    print(f">>> INSERTING QUESTION CATEGORY {row["category_label"]}")

                db_question_global = QuestionGlobal(
                    label=row["label"],
                    text_de=row["text_de"],
                    text_en=row["text_en"],
                    text_fr=row["text_fr"],
                    text_it=row["text_it"],
                    text_ro=row["text_ro"],
                )

                session.add(db_question_global)
                await session.flush()
                print(f">>> INSERTING QUESTION GLOBAL {row["label"]}")

        # Answer
        async with session.begin():
            crc = pd.read_csv("./app/data/mon_fichier_indexed.csv", index_col=0, header=0, sep=";")

            for index, row in crc.iterrows():

                if pd.isna(row["gemid"]):
                    continue
                result = await session.execute(select(Commune).filter_by(code=str(int(row["gemid"]))))
                db_commune = result.scalar_one_or_none()

                if db_commune is None:
                    print(f">>> INSERTING COMMUNE {row["gemidname"]}")
                    db_commune = Commune(
                        code=str(row["gemid"]),
                        name=row["gemidname"],
                        name_en=row["gemidname"],
                        name_fr=row["gemidname"],
                        name_it=row["gemidname"],
                        name_ro=row["gemidname"],
                        name_de=row["gemidname"],
                        district=db_district,
                    )
                    session.add(db_commune)
                    await session.flush()

                for col in crc:
                    if "GSB" in col:
                        survey = col.split("_")[0]
                        year = int(survey.replace("GSB", ""))
                        year = 2000 + year if year < 50 else 1900 + year

                        result = await session.execute(select(QuestionPerSurvey).filter_by(code=col))
                        db_question = result.scalar_one_or_none()

                        if db_question is None:
                            raise RuntimeError("Question not found")
                        db_answer = Answer(
                            year=year, question=db_question, commune=db_commune, value=str(crc[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()

                print(f">>> INSERTING ANSWER for commune {db_commune.name} {index}/{len(crc)}")

        # Answer for 2023 data (separate file)
        async with session.begin():
            GSB_2023 = pd.read_csv("./app/data/GSB 2023_V1.csv", index_col=0, header=1, sep=";")

            for index, row in GSB_2023.iterrows():

                if pd.isna(row["gemid"]):
                    continue
                result = await session.execute(select(Commune).filter_by(code=str(int(row["gemid"]))))
                db_commune = result.scalar_one_or_none()

                if db_commune is None:
                    db_commune = Commune(
                        code=str(row("gemid")),
                        name=row["gemidname"],
                        name_fr=row["gemidname"],
                        name_it=row["gemidname"],
                        name_ro=row["gemidname"],
                        name_en=row["gemidname"],
                        name_de=row["gemidname"],
                    )
                    session.add(db_commune)
                    await session.flush()

                for col in GSB_2023:
                    if "GSB" in col:
                        survey = col.split("_")[0]
                        year = int(survey.replace("GSB", ""))
                        year = 2000 + year if year < 50 else 1900 + year

                        result = await session.execute(select(QuestionPerSurvey).filter_by(code=col))
                        db_question = result.scalar_one_or_none()

                        if db_question is None:
                            raise RuntimeError("Question not found")
                        db_answer = Answer(
                            year=year, question=db_question, commune=db_commune, value=str(crc[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()

                    print(f">>> INSERTING ANSWER for commune {db_commune.name} {index}/{len(crc)}")
