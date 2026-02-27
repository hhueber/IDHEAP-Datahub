from pathlib import Path


from app.data.cantons import CANTONS
from app.db import SessionLocal
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

            db_question_globale_kant = QuestionGlobal()

            db_question_globale_spr = QuestionGlobal()

            db_question_globale_17_23 = QuestionGlobal()

            session.add(db_question_globale_kant)
            session.add(db_question_globale_spr)
            session.add(db_question_globale_17_23)

            for year in tqdm([2017, 2023], total=2, des="Processing all year"):
                db_survey = Survey(name=f"GSB{str(year)[2:]}", year=year)

                session.add(db_survey)
                await session.flush()

                db_question = QuestionPerSurvey(
                    code="kant",
                    label="kant",
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
                    code="spr",
                    label="spr",
                    survey=db_survey,
                    question_global=db_question_globale_spr,
                    text_de="Langue de la commune",
                    text_fr="Langue de la commune",
                    text_it="Langue de la commune",
                    text_en="Langue de la commune",
                    text_ro="Langue de la commune",
                )
                session.add(db_question)

                if year == 2017:
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

                    db_question_unique_23_2 = QuestionPerSurvey()
                    session.add(db_question_globale_23)
                    session.add(db_question_unique_23_1)
                    session.add(db_question_unique_23_2)

                session.commit()
