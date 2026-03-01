from pathlib import Path


from app.data.cantons import CANTONS
from app.db import SessionLocal
from app.models.answer import Answer
from app.models.canton import Canton
from app.models.commune import Commune
from app.models.district import District
from app.models.question_global import QuestionGlobal
from app.models.question_per_survey import QuestionPerSurvey
from app.models.survey import Survey
from sqlalchemy import select
from tqdm import tqdm
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent


async def populate_demo_db() -> None:
    async with SessionLocal() as session:
        # Add canton
        async with session.begin():
            index = 1
            total_item = len(CANTONS)
            for code, lang in tqdm(CANTONS.items(), total=len(CANTONS), desc="Processing cantons"):
                db_canton = Canton(
                    code=code,
                    name=lang["en"],
                    ofs_id=lang["ofs_id"],
                    name_de=lang["de"],
                    name_en=lang["en"],
                    name_fr=lang["fr"],
                    name_it=lang["it"],
                    name_ro=lang["ro"],
                )
                # print(f">>> CREATING {index}/{total_item} {db_canton.name}")
                index += 1

                session.add(db_canton)

        # District and commune
        row_number = 0
        async with session.begin():
            communes = pd.read_excel(Path(BASE_DIR, "data", "EtatCommunes.xlsx"), index_col=4, header=0)
            communes["Canton"] = communes["Canton"].apply(lambda x: "CH-" + x if isinstance(x, str) else None)
            communes["Numéro du district"] = communes["Numéro du district"].apply(lambda x: "B" + str(x).zfill(4))

            for index, rows in tqdm(communes.iterrows(), total=len(communes), desc="Processing districts"):
                result = await session.execute(select(Canton).filter_by(code=rows["Canton"]))
                db_canton = result.scalar_one_or_none()

                if db_canton is None:
                    RuntimeError("Canton not found")

                result = await session.execute(select(District).filter_by(name=rows["Nom du district"]))
                db_district = result.scalar_one_or_none()
                if db_district is not None:
                    pass  # print(">>> District already exists")
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
                    # print(f">>> INSERTING DISTRICT {db_district.name}")
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
                # print(f">>> INSERTING COMMUNE {rows['Nom de la commune']} {row_number}/{len(communes)} ")

        async with session.begin():

            db_question_globale_kant = QuestionGlobal(
                label="kant",
                text_de="Kantonszugehörigkeit Gemeinden",
                text_fr="Kantonszugehörigkeit Gemeinden",
                text_en="Kantonszugehörigkeit Gemeinden",
                text_it="Kantonszugehörigkeit Gemeinden",
                text_ro="Kantonszugehörigkeit Gemeinden",
            )

            db_question_globale_spr = QuestionGlobal(
                label="spr",
                text_de="Sprachgebiete der Schweiz",
                text_fr="Sprachgebiete der Schweiz",
                text_en="Sprachgebiete der Schweiz",
                text_it="Sprachgebiete der Schweiz",
                text_ro="Sprachgebiete der Schweiz",
            )

            db_question_globale_17_23 = QuestionGlobal(
                label="arbeiten",
                text_de="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit, d.h. erledigt er/sie auch administrative Tätigkeiten ähnlich wie Verwaltungsmitarbeitende?",
                text_fr="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit, d.h. erledigt er/sie auch administrative Tätigkeiten ähnlich wie Verwaltungsmitarbeitende?",
                text_en="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit, d.h. erledigt er/sie auch administrative Tätigkeiten ähnlich wie Verwaltungsmitarbeitende?",
                text_it="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit, d.h. erledigt er/sie auch administrative Tätigkeiten ähnlich wie Verwaltungsmitarbeitende?",
                text_ro="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit, d.h. erledigt er/sie auch administrative Tätigkeiten ähnlich wie Verwaltungsmitarbeitende?",
            )

            session.add(db_question_globale_kant)
            session.add(db_question_globale_spr)
            session.add(db_question_globale_17_23)

            for year in tqdm([2017, 2023], total=2, desc="Processing all year"):
                db_survey = Survey(name=f"GSB{str(year)[2:]}", year=year)

                session.add(db_survey)
                await session.flush()

                if year == 2017:
                    db_question = QuestionPerSurvey(
                        code="kant17",
                        label="kant17",
                        survey=db_survey,
                        question_global=db_question_globale_kant,
                        text_de="Canton de la commune",
                        text_fr="Canton de la commune",
                        text_it="Canton de la commune",
                        text_en="Canton de la commune",
                        text_ro="Canton de la commune",
                    )
                    session.add(db_question)

                    db_question = QuestionPerSurvey(
                        code="spr17",
                        label="spr17",
                        survey=db_survey,
                        question_global=db_question_globale_spr,
                        text_de="Langue de la commune",
                        text_fr="Langue de la commune",
                        text_it="Langue de la commune",
                        text_en="Langue de la commune",
                        text_ro="Langue de la commune",
                    )
                    session.add(db_question)
                    db_question_globale_17 = QuestionPerSurvey(
                        code="GSB17_Q58",
                        label="GSB17_Q58",
                        survey=db_survey,
                        question_global=db_question_globale_17_23,
                        text_de="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit,d.h.  erledigt  er/sie  auch  administrative  Tätigkeiten  ähnlich  wie Verwaltungsmitarbeitende?",
                        text_fr="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit,d.h.  erledigt  er/sie  auch  administrative  Tätigkeiten  ähnlich  wie Verwaltungsmitarbeitende?",
                        text_it="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit,d.h.  erledigt  er/sie  auch  administrative  Tätigkeiten  ähnlich  wie Verwaltungsmitarbeitende?",
                        text_ro="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit,d.h.  erledigt  er/sie  auch  administrative  Tätigkeiten  ähnlich  wie Verwaltungsmitarbeitende?",
                        text_en="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit,d.h.  erledigt  er/sie  auch  administrative  Tätigkeiten  ähnlich  wie Verwaltungsmitarbeitende?",
                    )
                    session.add(db_question_globale_17)

                    db_question_unique_17_1 = QuestionPerSurvey(
                        code="GSB17_Q3",
                        label="GSB17_Q3",
                        survey=db_survey,
                        text_de="Wie hat sich der Steuerfuss 2017 Ihrer Gemeinde im Vergleich zum Jahr 2010 verändert?",
                        text_fr="Wie hat sich der Steuerfuss 2017 Ihrer Gemeinde im Vergleich zum Jahr 2010 verändert?",
                        text_en="Wie hat sich der Steuerfuss 2017 Ihrer Gemeinde im Vergleich zum Jahr 2010 verändert?",
                        text_it="Wie hat sich der Steuerfuss 2017 Ihrer Gemeinde im Vergleich zum Jahr 2010 verändert?",
                        text_ro="Wie hat sich der Steuerfuss 2017 Ihrer Gemeinde im Vergleich zum Jahr 2010 verändert?",
                    )

                    session.add(db_question_unique_17_1)

                    db_question_unique_17_2 = QuestionPerSurvey(
                        code="GSB17_Q42",
                        label="GSB17_Q42",
                        survey=db_survey,
                        text_de="Wo werden die Exekutivmitglieder gewählt?",
                        text_fr="Wo werden die Exekutivmitglieder gewählt?",
                        text_it="Wo werden die Exekutivmitglieder gewählt?",
                        text_ro="Wo werden die Exekutivmitglieder gewählt?",
                        text_en="Wo werden die Exekutivmitglieder gewählt?",
                    )

                    session.add(db_question_unique_17_2)
                elif year == 2023:

                    db_question = QuestionPerSurvey(
                        code="kant23",
                        label="kant23",
                        survey=db_survey,
                        question_global=db_question_globale_kant,
                        text_de="Canton de la commune",
                        text_fr="Canton de la commune",
                        text_it="Canton de la commune",
                        text_en="Canton de la commune",
                        text_ro="Canton de la commune",
                    )
                    session.add(db_question)

                    db_question = QuestionPerSurvey(
                        code="spr23",
                        label="spr23",
                        survey=db_survey,
                        question_global=db_question_globale_spr,
                        text_de="Langue de la commune",
                        text_fr="Langue de la commune",
                        text_it="Langue de la commune",
                        text_en="Langue de la commune",
                        text_ro="Langue de la commune",
                    )
                    session.add(db_question)
                    db_question_globale_23 = QuestionPerSurvey(
                        code="GSB23_Q52",
                        label="GSB23_Q52",
                        survey=db_survey,
                        question_global=db_question_globale_17_23,
                        text_de="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit,d.h.  erledigt  er/sie  auch  administrative  Tätigkeiten  ähnlich  wie Verwaltungsmitarbeitende?",
                        text_fr="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit,d.h.  erledigt  er/sie  auch  administrative  Tätigkeiten  ähnlich  wie Verwaltungsmitarbeitende?",
                        text_it="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit,d.h.  erledigt  er/sie  auch  administrative  Tätigkeiten  ähnlich  wie Verwaltungsmitarbeitende?",
                        text_ro="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit,d.h.  erledigt  er/sie  auch  administrative  Tätigkeiten  ähnlich  wie Verwaltungsmitarbeitende?",
                        text_en="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit,d.h.  erledigt  er/sie  auch  administrative  Tätigkeiten  ähnlich  wie Verwaltungsmitarbeitende?",
                    )

                    db_question_unique_23_1 = QuestionPerSurvey(
                        code="GSB23_Q58",
                        label="GSB23_Q58",
                        survey=db_survey,
                        text_de="Welches ist Ihre höchste abgeschlossene Ausbildung?",
                        text_fr="Welches ist Ihre höchste abgeschlossene Ausbildung?",
                        text_en="Welches ist Ihre höchste abgeschlossene Ausbildung?",
                        text_it="Welches ist Ihre höchste abgeschlossene Ausbildung?",
                        text_ro="Welches ist Ihre höchste abgeschlossene Ausbildung?",
                    )

                    db_question_unique_23_2 = QuestionPerSurvey(
                        code="GSB23_Q27",
                        label="GSB23_Q27",
                        survey=db_survey,
                        text_de="Wie gestaltet sich aus Sicht Ihrer Gemeinde die Zusammenarbeit mit dem Kanton?",
                        text_fr="Wie gestaltet sich aus Sicht Ihrer Gemeinde die Zusammenarbeit mit dem Kanton?",
                        text_en="Wie gestaltet sich aus Sicht Ihrer Gemeinde die Zusammenarbeit mit dem Kanton?",
                        text_it="Wie gestaltet sich aus Sicht Ihrer Gemeinde die Zusammenarbeit mit dem Kanton?",
                        text_ro="Wie gestaltet sich aus Sicht Ihrer Gemeinde die Zusammenarbeit mit dem Kanton?",
                    )
                    session.add(db_question_globale_23)
                    session.add(db_question_unique_23_1)
                    session.add(db_question_unique_23_2)

                session.commit()

        # Adding answer
        async with session.begin():
            crc = pd.read_csv(Path(BASE_DIR, "data", "mon_fichier_indexed.csv"), index_col=0, header=0, sep=";")

            for index, row in tqdm(crc.iterrows(), total=len(crc), desc="Processing communes"):
                if pd.isna(row["gemid"]):
                    continue

                result = await session.execute(select(Commune).filter_by(code=str(int(row["gemid"]))))
                db_commune = result.scalar_one_or_none()

                if db_commune is None:
                    # print(f">>> INSERTING COMMUNE {row['gemidname']}")
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
                i = 0
                for col in crc:
                    if "kant17" in col:
                        result = await session.execute(select(QuestionPerSurvey).filter_by(code="kant17"))
                        db_question = result.scalar_one_or_none()
                        print(i)
                        db_answer = Answer(
                            year=2017, question=db_question, commune=db_commune, value=str(crc[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()
                        i += 1

                    elif "spr17" in col:
                        result = await session.execute(select(QuestionPerSurvey).filter_by(code="spr17"))
                        db_question = result.scalar_one_or_none()

                        db_answer = Answer(
                            year=2017, question=db_question, commune=db_commune, value=str(crc[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()

                    elif "GSB17_Q58" in col:
                        result = await session.execute(select(QuestionPerSurvey).filter_by(code="GSB17_Q58"))
                        db_question = result.scalar_one_or_none()

                        db_answer = Answer(
                            year=2017, question=db_question, commune=db_commune, value=str(crc[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()
                    elif col == "GSB17_Q3":
                        result = await session.execute(select(QuestionPerSurvey).filter_by(code="GSB17_Q3"))
                        db_question = result.scalar_one_or_none()

                        db_answer = Answer(
                            year=2017, question=db_question, commune=db_commune, value=str(crc[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()
                    elif "GSB17_Q42" in col:
                        result = await session.execute(select(QuestionPerSurvey).filter_by(code="GSB17_Q42"))
                        db_question = result.scalar_one_or_none()

                        db_answer = Answer(
                            year=2017, question=db_question, commune=db_commune, value=str(crc[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()

            GSB_2023 = pd.read_csv(Path(BASE_DIR, "data", "GSB 2023_V1.csv"), header=0, sep=";")
            for index, row in tqdm(GSB_2023.iterrows(), total=len(GSB_2023), desc="Processing Commune for 2023"):
                if pd.isna(row["BFS_2023"]):
                    continue
                result = await session.execute(select(Commune).filter_by(code=str(int(row["BFS_2023"]))))
                db_commune = result.scalar_one_or_none()

                if db_commune is None:
                    db_commune = Commune(
                        code=str(row("BFS_2023")),
                        name=row["Gemeinde_2023"],
                        name_fr=row["Gemeinde_2023"],
                        name_it=row["Gemeinde_2023"],
                        name_ro=row["Gemeinde_2023"],
                        name_en=row["Gemeinde_2023"],
                        name_de=row["Gemeinde_2023"],
                    )
                    session.add(db_commune)
                    await session.flush()
                for col in GSB_2023:
                    if "kant" in col:
                        result = await session.execute(select(QuestionPerSurvey).filter_by(code="kant23"))
                        db_question = result.scalar_one_or_none()

                        db_answer = Answer(
                            year=2023, question=db_question, commune=db_commune, value=str(GSB_2023[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()

                    elif "spr" in col:
                        result = await session.execute(select(QuestionPerSurvey).filter_by(code="spr23"))
                        db_question = result.scalar_one_or_none()

                        db_answer = Answer(
                            year=2023, question=db_question, commune=db_commune, value=str(GSB_2023[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()

                    elif "GSB23_Q52" in col:
                        result = await session.execute(select(QuestionPerSurvey).filter_by(code="GSB23_Q52"))
                        db_question = result.scalar_one_or_none()

                        db_answer = Answer(
                            year=2023, question=db_question, commune=db_commune, value=str(GSB_2023[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()

                    elif "GSB23_Q58" in col:
                        result = await session.execute(select(QuestionPerSurvey).filter_by(code="GSB23_Q58"))
                        db_question = result.scalar_one_or_none()

                        db_answer = Answer(
                            year=2023, question=db_question, commune=db_commune, value=str(GSB_2023[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()
                    elif "GSB23_Q27" in col:
                        result = await session.execute(select(QuestionPerSurvey).filter_by(code="GSB23_Q27"))
                        db_question = result.scalar_one_or_none()

                        db_answer = Answer(
                            year=2023, question=db_question, commune=db_commune, value=str(GSB_2023[col][index])
                        )
                        session.add(db_answer)
                        await session.flush()

        # Adding Option
        async with session.begin():
            pass
