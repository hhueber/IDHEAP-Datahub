from typing import List, Optional


from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class QuestionGlobal(Base):
    __tablename__ = "question_global"

    uid: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String)

    question_category_uid: Mapped[Optional[int]] = mapped_column(ForeignKey("question_category.uid"), nullable=True)
    question_category: Mapped[Optional["QuestionCategory"]] = relationship(
        "QuestionCategory", back_populates="questions_global"
    )

    text_de: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_fr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_it: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_ro: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_en: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    questions_linked: Mapped[List["QuestionPerSurvey"]] = relationship(
        "QuestionPerSurvey", back_populates="question_global"
    )
