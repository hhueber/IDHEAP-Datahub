from typing import List, Optional


from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class QuestionCategory(Base):
    __tablename__ = "question_category"

    uid: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String, unique=True)

    text_de: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_fr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_it: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_ro: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_en: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    options: Mapped[List["Option"]] = relationship(
        "Option", back_populates="question_category", cascade="all, delete-orphan"
    )

    questions_global: Mapped[List["QuestionGlobal"]] = relationship(
        "QuestionGlobal", back_populates="question_category"
    )
    questions_per_survey: Mapped[List["QuestionPerSurvey"]] = relationship(
        "QuestionPerSurvey", back_populates="question_category"
    )
