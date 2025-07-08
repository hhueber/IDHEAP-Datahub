from typing import List, Optional


from sqlalchemy import ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Answer import Answer
from webapp.models.Base import Base
from webapp.models.QuestionCategory import QuestionCategory


class Option(Base):
    """
    Represents a selectable answer choice for questions that have predefined options.

    Attributes:
        uid                  – Primary key for this option record.
        value                – Core value stored in the database.
        _label               – Optional human-readable override for the value.
        text_de/.../text_en  – Translations of the label in German, French, Italian, Romansh, and English.
        question_category    – Relationship to the parent QuestionCategory.
        answers              – Collection of Answer objects that used this option.
    """    
    __tablename__ = "option"

    uid: Mapped[int] = mapped_column(primary_key=True)

    value: Mapped[str]

    question_category_uid: Mapped[int] = mapped_column(ForeignKey("question_category.uid"))
    question_category: Mapped["QuestionCategory"] = relationship(back_populates="options")

    # Optional
    _label: Mapped[Optional[str]]

    @hybrid_property
    def label(self):
        """
        Return the override label if set; otherwise, use the core `value`.
        This lets us display a friendly label when available.
        """
        return self._label or self.value

    @label.setter
    def label(self, label):
        """
        Setter for the `label` hybrid property: stores text into `_label`.
        """
        self._label = label

    text_de: Mapped[Optional[str]]
    text_fr: Mapped[Optional[str]]
    text_it: Mapped[Optional[str]]
    text_ro: Mapped[Optional[str]]
    text_en: Mapped[Optional[str]]

    answers: Mapped[List["Answer"]] = relationship(back_populates="option")

    def __repr__(self):
        """
        Show the label of this option.
        """
        return f"{self.label}"
