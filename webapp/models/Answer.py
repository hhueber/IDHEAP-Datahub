from typing import Optional


from sqlalchemy import ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.Commune import Commune
from webapp.models.Option import Option
from webapp.models.QuestionPerSurvey import QuestionPerSurvey


class Answer(Base):
    """
    Represents a single survey response from a municipality (‘commune’) to a specific question.
    
    Attributes:
        uid               – Unique identifier for this answer record.
        year              – Survey year when the answer was collected.
        question          – Relationship to the QuestionPerSurvey this answer addresses.
        commune           – Relationship to the Commune that provided the answer.
        option            – (Optional) Relationship to a predefined Option, if the question had set choices.
        _value            – (Optional) Free-text or fallback value when no Option applies.
    
    The `value` hybrid property returns either `_value` (if present) or the linked Option’s value.
    """
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
        """
        Return the user-provided value if available; otherwise, fall back to the Option’s stored value.
        This lets us treat both typed-in and choice-based answers uniformly.
        """
        return self._value or self.option.value

    @value.setter
    def value(self, value):
        """
        Setter for the hybrid `value` property: stores text into the `_value` column.
        """
        self._value = value

    def __repr__(self):
        """
        Representation showing which commune answered which question.
        """
        return f"Answer from commune #{self.commune.code} to question #{self.question.code}"
