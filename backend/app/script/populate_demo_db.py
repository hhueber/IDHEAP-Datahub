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
                text_fr="Appartenance cantonale Communes",
                text_en="Cantonal affiliation Municipalities",
                text_it="Appartenenza cantonale Comuni",
                text_ro="Appartegnientscha al chantun da las vischnancas",
            )

            db_question_globale_spr = QuestionGlobal(
                label="spr",
                text_de="Sprachgebiete der Schweiz",
                text_fr="Régions linguistiques de la Suisse",
                text_en="Swiss language regions",
                text_it="Aree linguistiche della Svizzera",
                text_ro="territoris linguistics da la Svizra",
            )

            db_question_globale_17_23 = QuestionGlobal(
                label="arbeiten",
                text_de="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit, d.h. erledigt er/sie auch administrative Tätigkeiten ähnlich wie Verwaltungsmitarbeitende?",
                text_fr="Le/la président(e) de commune participe-t-il/elle activement à la gestion, c’est-à-dire qu’il/elle effectue-t-il/elle aussi des tâches administratives similaires à celles des employés de la gestion?",
                text_en="Does the mayor actively participate in the administration, i.e. does he/she also perform administrative tasks similar to those of administrative staff?",
                text_it="Il/la presidente del comune collabora attivamente alla gestione, ad esempio svolgendo compiti amministrativi analoghi a quelli dei collaboratori amministrativi?",
                text_ro="Collavurescha il president communal activamain en l’administraziun, q.v.d. fa el er activitads administrativas, sumegliant a las collavuraturas ed als collavuraturs administrativs?",
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
                        text_de="Kantonszugehörigkeit Gemeinden",
                        text_fr="Appartenance cantonale Communes",
                        text_en="Cantonal affiliation Municipalities",
                        text_it="Appartenenza cantonale Comuni",
                        text_ro="Appartegnientscha al chantun da las vischnancas",
                    )
                    session.add(db_question)

                    db_question = QuestionPerSurvey(
                        code="spr17",
                        label="spr17",
                        survey=db_survey,
                        question_global=db_question_globale_spr,
                        text_de="Sprachgebiete der Schweiz",
                        text_fr="Régions linguistiques de la Suisse",
                        text_en="Swiss language regions",
                        text_it="Aree linguistiche della Svizzera",
                        text_ro="territoris linguistics da la Svizra",
                    )
                    session.add(db_question)
                    db_question_globale_17 = QuestionPerSurvey(
                        code="GSB17_Q58",
                        label="GSB17_Q58",
                        survey=db_survey,
                        question_global=db_question_globale_17_23,
                        text_de="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit, d.h. erledigt er/sie auch administrative Tätigkeiten ähnlich wie Verwaltungsmitarbeitende?",
                        text_fr="Le/la président(e) de commune participe-t-il/elle activement à la gestion, c’est-à-dire qu’il/elle effectue-t-il/elle aussi des tâches administratives similaires à celles des employés de la gestion?",
                        text_en="Does the mayor actively participate in the administration, i.e. does he/she also perform administrative tasks similar to those of administrative staff?",
                        text_it="Il/la presidente del comune collabora attivamente alla gestione, ad esempio svolgendo compiti amministrativi analoghi a quelli dei collaboratori amministrativi?",
                        text_ro="Collavurescha il president communal activamain en l’administraziun, q.v.d. fa el er activitads administrativas, sumegliant a las collavuraturas ed als collavuraturs administrativs?",
                    )
                    session.add(db_question_globale_17)

                    db_question_unique_17_1 = QuestionPerSurvey(
                        code="GSB17_Q3",
                        label="GSB17_Q3",
                        survey=db_survey,
                        text_de="Wie hat sich der Steuerfuss 2017 Ihrer Gemeinde im Vergleich zum Jahr 2010 verändert?",
                        text_fr="Comment le taux d’imposition de votre commune a-t-il évolué en 2017 par rapport à 2010?",
                        text_en="How has the tax rate in your municipality changed in 2017 compared to 2010?",
                        text_it="Come è cambiato il tasso d’imposta della sua comunità nel 2017 rispetto al 2010?",
                        text_ro="Wie hat sich der Steuerfuss 2017 Ihrer Gemeinde im Vergleich zum Jahr 2010 verändert?",
                    )

                    session.add(db_question_unique_17_1)

                    db_question_unique_17_2 = QuestionPerSurvey(
                        code="GSB17_Q42",
                        label="GSB17_Q42",
                        survey=db_survey,
                        text_de="Wo werden die Exekutivmitglieder gewählt?",
                        text_fr="Où les membres exécutifs sont-ils élus?",
                        text_it="Dove vengono eletti i membri esecutivi?",
                        text_ro="Nua vegnan elegids ils commembers da l’executiva?",
                        text_en="Where are the executive members elected?",
                    )

                    session.add(db_question_unique_17_2)
                elif year == 2023:

                    db_question = QuestionPerSurvey(
                        code="kant23",
                        label="kant23",
                        survey=db_survey,
                        question_global=db_question_globale_kant,
                        text_de="Kantonszugehörigkeit Gemeinden",
                        text_fr="Appartenance cantonale Communes",
                        text_en="Cantonal affiliation Municipalities",
                        text_it="Appartenenza cantonale Comuni",
                        text_ro="Appartegnientscha al chantun da las vischnancas",
                    )
                    session.add(db_question)

                    db_question = QuestionPerSurvey(
                        code="spr23",
                        label="spr23",
                        survey=db_survey,
                        question_global=db_question_globale_spr,
                        text_de="Sprachgebiete der Schweiz",
                        text_fr="Régions linguistiques de la Suisse",
                        text_en="Swiss language regions",
                        text_it="Aree linguistiche della Svizzera",
                        text_ro="territoris linguistics da la Svizra",
                    )
                    session.add(db_question)
                    db_question_globale_23 = QuestionPerSurvey(
                        code="GSB23_Q52",
                        label="GSB23_Q52",
                        survey=db_survey,
                        question_global=db_question_globale_17_23,
                        text_de="Arbeitet der/die Gemeindepräsident/-in aktiv in der Verwaltung mit, d.h. erledigt er/sie auch administrative Tätigkeiten ähnlich wie Verwaltungsmitarbeitende?",
                        text_fr="Le/la président(e) de commune participe-t-il/elle activement à la gestion, c’est-à-dire qu’il/elle effectue-t-il/elle aussi des tâches administratives similaires à celles des employés de la gestion?",
                        text_en="Does the mayor actively participate in the administration, i.e. does he/she also perform administrative tasks similar to those of administrative staff?",
                        text_it="Il/la presidente del comune collabora attivamente alla gestione, ad esempio svolgendo compiti amministrativi analoghi a quelli dei collaboratori amministrativi?",
                        text_ro="Collavurescha il president communal activamain en l’administraziun, q.v.d. fa el er activitads administrativas, sumegliant a las collavuraturas ed als collavuraturs administrativs?",
                    )

                    db_question_unique_23_1 = QuestionPerSurvey(
                        code="GSB23_Q58",
                        label="GSB23_Q58",
                        survey=db_survey,
                        text_de="Welches ist Ihre höchste abgeschlossene Ausbildung?",
                        text_fr="Quel est le niveau le plus élevé d’éducation que vous avez atteint?",
                        text_en="What is your highest completed education?",
                        text_it="Qual è il suo più alto livello di istruzione conseguito?",
                        text_ro="Tgenina è Vossa pli auta scolaziun terminada?",
                    )

                    db_question_unique_23_2 = QuestionPerSurvey(
                        code="GSB23_Q27",
                        label="GSB23_Q27",
                        survey=db_survey,
                        text_de="Wie gestaltet sich aus Sicht Ihrer Gemeinde die Zusammenarbeit mit dem Kanton?",
                        text_fr="Comment se présente la collaboration avec le canton du point de vue de votre commune?",
                        text_en="How does the cooperation with the canton look like from the perspective of your community?",
                        text_it="Come si presenta la collaborazione con il Cantone dal punto di vista del comune?",
                        text_ro="Co sa preschenta or da vista da Vossa vischnanca la collavuraziun cun il chantun?",
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
