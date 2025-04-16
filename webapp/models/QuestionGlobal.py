from typing import List, Optional


from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.QuestionCategory import QuestionCategory
from webapp.models.QuestionPerSurvey import QuestionPerSurvey


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
