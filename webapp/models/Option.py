from typing import List, Optional


from sqlalchemy import ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Answer import Answer
from webapp.models.Base import Base
from webapp.models.QuestionCategory import QuestionCategory


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
