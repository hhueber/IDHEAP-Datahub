from datetime import datetime
from typing import List, Optional
import os
import re
import secrets
import string
import pandas as pd 


if __name__ == "__main__":
    from config import BASEDIR, Config
    from data.cantons import CANTONS
else:
    from ..webapp.config import BASEDIR, Config
    from ..webapp.data.cantons import CANTONS

from sqlalchemy import create_engine, ForeignKey, select
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, Session
from werkzeug.security import check_password_hash, generate_password_hash

from webapp.models.Base import Base
from webapp.models.Canton import Canton
from webapp.models.District import District
from webapp.models.Commune import Commune
from webapp.models.Survey import Survey
from webapp.models.QuestionPerSurvey import QuestionPerSurvey
from webapp.models.QuestionGlobal import QuestionGlobal
from webapp.models.QuestionCategory import QuestionCategory
from webapp.models.Option import Option
from webapp.models.Answer import Answer
from webapp.models.User import User

"""
Populate the database with initial geographic, survey, question, and answer data,
along with an admin user. Intended to be run as a standalone script.
"""

if __name__ == "__main__":
    engine = create_engine(Config.DB_URI, echo=True)
    if "sqlite" in DB_URI:
        db_name = DB_URI.replace("sqlite:///", "")
        if os.path.isfile(db_name):
            os.rename(db_name, f"{db_name}-{datetime.now().isoformat().replace(':', '-')}.old")
        engine = create_engine(DB_URI, echo=True)
        Base.metadata.create_all(engine)

        # Populate
        with Session(engine) as session:

            # Cantons
            with session.begin():
                for code, lang in CANTONS.items():
                    db_canton = Canton(
                        code=code,
                        name=lang["en"],
                        name_de=lang["de"],
                        name_fr=lang["fr"],
                        name_it=lang["it"],
                        name_ro=lang["ro"],
                        name_en=lang["en"],
                    )
                    print(f">>> CREATING: {db_canton.name}")
                    session.add(db_canton)
                    session.flush()


            # Districts and communes
            with session.begin():
                communes = pd.read_excel(
                    os.path.join(BASEDIR, "data", "EtatCommunes.xlsx"),
                    index_col=4,
                    header=0,
                )
                communes["Canton"] = communes["Canton"].apply(lambda x: "CH-" + x if isinstance(x, str) else None)
                communes["Numéro du district"] = communes["Numéro du district"].apply(lambda x: "B" + str(x).zfill(4))

                for index, row in communes.iterrows():
                    db_canton = session.execute(select(Canton).filter_by(code=row["Canton"])).one_or_none()
                    if db_canton:
                        db_canton = db_canton[0]
                    else:
                        raise RuntimeError("bleh")

                    # Districts
                    db_district = session.execute(select(District).filter_by(name=row["Nom du district"])).one_or_none()
                    if db_district:
                        db_district = db_district[0]
                        print(f">>> ALREADY EXISTING: {db_district.name}")
                    else:
                        db_district = District(
                            code=row["Numéro du district"],
                            name=row["Nom du district"],
                            name_de=row["Nom du district"],
                            name_fr=row["Nom du district"],
                            name_it=row["Nom du district"],
                            name_ro=row["Nom du district"],
                            name_en=row["Nom du district"],
                            canton=db_canton,
                        )
                        print(f">>> CREATING: {db_district.name}")
                        session.add(db_district)
                        session.flush()

                    # Communes
                    db_commune = Commune(
                        code=index,
                        name=row["Nom de la commune"],
                        name_de=row["Nom de la commune"],
                        name_fr=row["Nom de la commune"],
                        name_it=row["Nom de la commune"],
                        name_ro=row["Nom de la commune"],
                        name_en=row["Nom de la commune"],
                        district=db_district,
                    )
                    print(f">>> CREATING: {db_commune.name}")
                    session.add(db_commune)
                    session.flush()

            # Surveys and questions per survey
            with session.begin():
                for year in [1988, 1994, 1998, 2005, 2009, 2017, 2023]:
                    db_survey = Survey(
                        name=f"GSB{str(year)[2:]}",
                        year=year,
                    )
                    session.add(db_survey)
                    session.flush()

                    gsb = pd.read_excel(
                        os.path.join(BASEDIR, "data", "CodeBook_Cleaned.xlsx"),
                        sheet_name=str(year),
                        index_col=1,
                        header=0,
                    )
                    for index, row in gsb.iterrows():
                        db_question = QuestionPerSurvey(
                            code=index,
                            label=row["label"],
                            survey=db_survey,
                            text_de=row["text_de"],
                            text_fr=row["text_fr"],
                            text_it=row["text_it"],
                            text_ro=row["text_ro"],
                            text_en=row["text_en"],
                        )
                        session.add(db_question)
                        session.flush()

            # Global questions and categories
            with session.begin():
                gq = pd.read_csv(
                    os.path.join(BASEDIR, "data", "QuestionsGlobales.csv"),
                    index_col=None,
                    header=0,
                )
                for index, row in gq.iterrows():
                    if not pd.isnull(row["category_label"]):
                        db_question_category = QuestionCategory(
                            label=row["category_label"],
                            text_de=row["category_text_de"],
                            text_fr=row["category_text_fr"],
                            text_it=row["category_text_it"],
                            text_ro=row["category_text_ro"],
                            text_en=row["category_text_en"],
                        )

                        session.add(db_question_category)
                        session.flush()

                        for option_value, option_label in zip(
                            row["options_value"].split(";"), row["options_label"].split(";")
                        ):
                            db_option = Option(
                                value=option_value,
                                label=option_label,
                                question_category=db_question_category,
                            )
                            session.add(db_option)
                            session.flush()
                    else:
                        db_question_category = None

                    db_global_question = QuestionGlobal(
                        label=row["label"],
                        question_category=db_question_category,
                        text_de=row["text_de"],
                        text_fr=row["text_fr"],
                        text_it=row["text_it"],
                        text_ro=row["text_ro"],
                        text_en=row["text_en"],
                    )
                    if not pd.isnull(row["survey_codes"]):
                        for qid in row["survey_codes"].split(";"):
                            db_qps = session.execute(select(QuestionPerSurvey).filter_by(code=qid)).one_or_none()
                            if db_qps:
                                db_qps = db_qps[0]
                                db_global_question.questions_linked.append(db_qps)
                    session.add(db_global_question)
                    session.flush()

            # Answers
            with session.begin():
                answers = pd.read_excel(
                    os.path.join(BASEDIR, "..", "data", "demo_answers.xlsx"),
                    index_col=0,
                    header=0,
                )
                for col in answers.columns:
                    print(f">>> CURRENT ANSWER: {col}")
                    if "GSB" in col:
                        survey = col.split("_")[0]
                        year = int(survey.replace("GSB", ""))
                        year = 2000 + year if year < 50 else 1900 + year

                        db_qps = session.execute(select(QuestionPerSurvey).filter_by(code=col)).one_or_none()
                        if db_qps:
                            db_qps = db_qps[0]
                            print(f">>> QUESTION FOUND: {col}")

                            for index, _ in answers[col].items():
                                db_commune = session.execute(select(Commune).filter_by(code=index)).one_or_none()
                                if db_commune:
                                    db_commune = db_commune[0]
                                else:
                                    db_commune = Commune(
                                        code=index,
                                        name=answers["gemidname"][index],
                                        name_de=answers["gemidname"][index],
                                        name_fr=answers["gemidname"][index],
                                        name_it=answers["gemidname"][index],
                                        name_ro=answers["gemidname"][index],
                                        name_en=answers["gemidname"][index],
                                        district=db_district,
                                    )
                                    print(f">>> CREATING: {db_commune.name}")
                                    session.add(db_commune)
                                    session.flush()

                                print(f">>> CREATING ANSWER: COMMUNE {db_commune.name}")
                                db_answer = Answer(
                                    year=year,
                                    question=db_qps,
                                    commune=db_commune,
                                    _value=answers[col][index],
                                )
                                session.add(db_answer)
                                session.flush()

            # Admin
            with session.begin():
                alphabet = string.ascii_letters + string.digits
                password = "".join(secrets.choice(alphabet) for i in range(8))

                print(f">>> CREATING admin")
                admin = User(
                    username="admin",
                    email="noreply@unil.ch",
                    password=password,
                )
                session.add(admin)
                session.flush()

            print(f"Password for admin (please change it): {password}")
    else:
        raise NotImplementedError