from typing import Optional


from question_category import QuestionCategory
from question_global_option_association import QuestionGlobalOptionAssociation
from question_per_survey import QuestionPerSurvey
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class QuestionGlobal(Base):
    __tablename__ = "question_global"

    uid: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String)

    question_category_uid: Mapped[int | None] = mapped_column(ForeignKey("question_category.uid"), nullable=True)
    question_category: Mapped[Optional["QuestionCategory"]] = relationship(
        "QuestionCategory", back_populates="questions_global"
    )

    text_de: Mapped[str | None] = mapped_column(String, nullable=True)
    text_fr: Mapped[str | None] = mapped_column(String, nullable=True)
    text_it: Mapped[str | None] = mapped_column(String, nullable=True)
    text_rm: Mapped[str | None] = mapped_column(String, nullable=True)
    text_en: Mapped[str | None] = mapped_column(String, nullable=True)

    questions_linked: Mapped[list["QuestionPerSurvey"]] = relationship(
        "QuestionPerSurvey", back_populates="question_global"
    )

    option_association: Mapped[list["QuestionGlobalOptionAssociation"]] = relationship(
        "QuestionGlobalOptionAssociation",
        back_populates="question",
        cascade="all, delete-orphan",
    )
