from typing import List, Optional


from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.Option import Option
from webapp.models.QuestionGlobal import QuestionGlobal
from webapp.models.QuestionPerSurvey import QuestionPerSurvey


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
