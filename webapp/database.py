from typing import List, Optional
import datetime
import os
import re


from config import BASEDIR, DB_URI
from initial_data.cantons import CANTONS
from sqlalchemy import create_engine, ForeignKey, select
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, Session
import pandas as pd


convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    @classmethod
    def get_attributes(cls):
        return [attr for attr in vars(cls) if not attr.startswith("_") and not attr[0].isupper()]


class Survey(Base):
    __tablename__ = "survey"

    uid: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    year: Mapped[int]

    questions: Mapped[List["QuestionPerSurvey"]] = relationship(back_populates="survey")

    @property
    def num_questions(self):
        return len(self.questions) or None

    def __lt__(self, other):
        return self.year < other.year

    def __repr__(self):
        return f"{self.name} ({self.year})"


class Canton(Base):
    __tablename__ = "canton"

    uid: Mapped[int] = mapped_column(primary_key=True)

    code: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(unique=True)

    name_de: Mapped[str]
    name_fr: Mapped[str]
    name_it: Mapped[str]
    name_ro: Mapped[str]
    name_en: Mapped[str]

    districts: Mapped[List["District"]] = relationship(back_populates="canton")

    @property
    def num_districts(self):
        return len(self.districts)

    @property
    def num_communes(self):
        return sum(district.num_communes for district in self.districts)

    def __repr__(self):
        return f"{self.name} ({self.code})"


class District(Base):
    __tablename__ = "district"

    uid: Mapped[int] = mapped_column(primary_key=True)

    code: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(unique=True)

    name_de: Mapped[str]
    name_fr: Mapped[str]
    name_it: Mapped[str]
    name_ro: Mapped[str]
    name_en: Mapped[str]

    canton_uid: Mapped[int] = mapped_column(ForeignKey("canton.uid"))
    canton: Mapped["Canton"] = relationship(back_populates="districts")

    communes: Mapped[List["Commune"]] = relationship(back_populates="district")

    @property
    def num_communes(self):
        return len(self.communes)

    def __repr__(self):
        return f"{self.name} ({self.code})"


class Commune(Base):
    __tablename__ = "commune"

    uid: Mapped[int] = mapped_column(primary_key=True)

    code: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(unique=True)

    name_de: Mapped[str]
    name_fr: Mapped[str]
    name_it: Mapped[str]
    name_ro: Mapped[str]
    name_en: Mapped[str]

    district_uid: Mapped[int] = mapped_column(ForeignKey("district.uid"))
    district: Mapped["District"] = relationship(back_populates="communes")

    @property
    def canton(self):
        return self.district.canton

    answers: Mapped[List["Answer"]] = relationship(back_populates="commune")

    def __repr__(self):
        return f"{self.name} ({self.code})"


class QuestionCategory(Base):
    __tablename__ = "question_category"

    uid: Mapped[int] = mapped_column(primary_key=True)

    label: Mapped[str] = mapped_column(unique=True)

    # Optional
    text_de: Mapped[Optional[str]]
    text_fr: Mapped[Optional[str]]
    text_it: Mapped[Optional[str]]
    text_ro: Mapped[Optional[str]]
    text_en: Mapped[Optional[str]]

    options: Mapped[List["Option"]] = relationship(back_populates="question_category")

    questions_global: Mapped[List["QuestionGlobal"]] = relationship(back_populates="question_category")
    questions_per_survey: Mapped[List["QuestionPerSurvey"]] = relationship(back_populates="question_category")

    def __repr__(self):
        return f"{self.label} ({len(self.options)} option{'' if len(self.options) == 1 else 's'})"


class Option(Base):
    __tablename__ = "option"

    uid: Mapped[int] = mapped_column(primary_key=True)

    value: Mapped[str]

    question_category_uid: Mapped[int] = mapped_column(ForeignKey("question_category.uid"))
    question_category: Mapped["QuestionCategory"] = relationship(back_populates="options")

    # Optional
    _label: Mapped[Optional[str]]

    @hybrid_property
    def label(self):
        return self._label or self.value

    @label.setter
    def label(self, label):
        self._label = label

    text_de: Mapped[Optional[str]]
    text_fr: Mapped[Optional[str]]
    text_it: Mapped[Optional[str]]
    text_ro: Mapped[Optional[str]]
    text_en: Mapped[Optional[str]]

    answers: Mapped[List["Answer"]] = relationship(back_populates="option")

    def __repr__(self):
        return f"{self.label}"


class QuestionGlobal(Base):
    __tablename__ = "question_global"

    uid: Mapped[int] = mapped_column(primary_key=True)

    label: Mapped[str]

    # Optional
    question_category_uid: Mapped[Optional[int]] = mapped_column(ForeignKey("question_category.uid"))
    question_category: Mapped["QuestionCategory"] = relationship(back_populates="questions_global")

    text_de: Mapped[Optional[str]]
    text_fr: Mapped[Optional[str]]
    text_it: Mapped[Optional[str]]
    text_ro: Mapped[Optional[str]]
    text_en: Mapped[Optional[str]]

    questions_linked: Mapped[List["QuestionPerSurvey"]] = relationship(back_populates="question_global")

    @property
    def linked_surveys(self):
        return list(set([question.survey for question in self.questions_linked]))

    def __repr__(self):
        return f"Question Global #{self.uid}"


class QuestionPerSurvey(Base):
    __tablename__ = "question_per_survey"

    uid: Mapped[int] = mapped_column(primary_key=True)

    code: Mapped[str] = mapped_column(unique=True)
    label: Mapped[str]

    # Optional
    question_category_uid: Mapped[Optional[int]] = mapped_column(ForeignKey("question_category.uid"))
    question_category: Mapped["QuestionCategory"] = relationship(back_populates="questions_per_survey")

    text_de: Mapped[Optional[str]]
    text_fr: Mapped[Optional[str]]
    text_it: Mapped[Optional[str]]
    text_ro: Mapped[Optional[str]]
    text_en: Mapped[Optional[str]]

    survey_uid: Mapped[int] = mapped_column(ForeignKey("survey.uid"))
    survey: Mapped["Survey"] = relationship(back_populates="questions")

    question_global_uid: Mapped[Optional[int]] = mapped_column(ForeignKey("question_global.uid"))
    question_global: Mapped["QuestionGlobal"] = relationship(back_populates="questions_linked")

    answers: Mapped[List["Answer"]] = relationship(back_populates="question")

    @property
    def num_answers(self):
        return len(self.answers) or None

    def __lt__(self, other):
        study_name_left, question_left = self.code.split("_", 1)
        study_name_right, question_right = other.code.split("_", 1)

        if study_name_left != study_name_right:
            return self.survey < other.survey

        if question_left == question_right:
            return False

        question_left = question_left.split("_")
        question_right = question_right.split("_")

        for l, r in zip(question_left, question_right):
            if l == r:
                continue

            if l is None:
                return True
            if r is None:
                return False

            l_re = re.split(r"(\d+)", l)
            r_re = re.split(r"(\d+)", r)
            for l2, r2 in zip(l_re, r_re):
                if l2 == r2:
                    continue

                if l2 is None:
                    return True
                if r2 is None:
                    return False

                if l2.isdigit() and r2.isdigit():
                    return int(l2) < int(r2)
                else:
                    return l2 < r2

    def __repr__(self):
        return f"Question #{self.code} from survey #{self.survey_uid}"


class Answer(Base):
    __tablename__ = "answer"

    uid: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int]

    question_uid: Mapped[int] = mapped_column(ForeignKey("question_per_survey.uid"))
    question: Mapped["QuestionPerSurvey"] = relationship(back_populates="answers")

    commune_uid: Mapped[int] = mapped_column(ForeignKey("commune.uid"))
    commune: Mapped["Commune"] = relationship(back_populates="answers")

    # Optional, either one or the other
    option_uid: Mapped[Optional[int]] = mapped_column(ForeignKey("option.uid"))
    option: Mapped["Option"] = relationship(back_populates="answers")

    _value: Mapped[Optional[str]]

    @hybrid_property
    def value(self):
        return self._value or self.option.value

    @value.setter
    def value(self, value):
        self._value = value

    def __repr__(self):
        return f"Answer from commune #{self.commune.code} to question #{self.question.code}"


if __name__ == "__main__":
    if "sqlite" in DB_URI:
        db_name = DB_URI.replace("sqlite:///", "")
        if os.path.isfile(db_name):
            os.rename(db_name, f"{db_name}-{datetime.datetime.now().isoformat().replace(':', '-')}.old")
        engine = create_engine(DB_URI, echo=True)
        Base.metadata.create_all(engine)

        # Populate
        with Session(engine) as session:
            communes = pd.read_excel(
                os.path.join(BASEDIR, "initial_data", "EtatCommunes.xlsx"),
                index_col=4,
                header=0,
            )
            communes["Canton"] = communes["Canton"].apply(lambda x: "CH-" + x if isinstance(x, str) else None)
            communes["Numéro du district"] = communes["Numéro du district"].apply(lambda x: "B" + str(x).zfill(4))

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

            with session.begin():
                for index, row in communes.iterrows():
                    db_canton = session.execute(select(Canton).filter_by(code=row["Canton"])).one_or_none()
                    if db_canton:
                        canton_id = db_canton[0].uid
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
                            canton_uid=canton_id,
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
                        district_uid=db_district.uid,
                    )
                    print(f">>> CREATING: {db_commune.name}")
                    session.add(db_commune)
                    session.flush()

            for year in [1988, 1994, 1998, 2005, 2009, 2017]:
                db_survey = Survey(
                    name=f"GSB{str(year)[2:]}",
                    year=year,
                )
                session.add(db_survey)
                session.flush()

                gsb = pd.read_excel(
                    os.path.join(BASEDIR, "initial_data", "Extraction CodeBook - 3. Cleaned.xlsx"),
                    sheet_name=str(year),
                    index_col=1,
                    header=0,
                )
                for index, row in gsb.iterrows():
                    db_question = QuestionPerSurvey(
                        code=index,
                        label=row["label"],
                        survey_uid=db_survey.uid,
                    )
                    session.add(db_question)
                    session.flush()

            gq = pd.read_excel(
                os.path.join(BASEDIR, "initial_data", "QuestionGlobales.xlsx"),
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
                session.add(db_global_question)
                session.flush()

            session.commit()
    else:
        raise NotImplementedError
