from typing import List, Optional
import re


from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Answer import Answer
from webapp.models.Base import Base
from webapp.models.QuestionCategory import QuestionCategory
from webapp.models.QuestionGlobal import QuestionGlobal
from webapp.models.Survey import Survey


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
