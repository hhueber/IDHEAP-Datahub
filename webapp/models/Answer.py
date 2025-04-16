from typing import Optional


from sqlalchemy import ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.Commune import Commune
from webapp.models.Option import Option
from webapp.models.QuestionPerSurvey import QuestionPerSurvey


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
