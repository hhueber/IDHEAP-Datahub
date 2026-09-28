from typing import Optional


from answer import Answer
from question_category import QuestionCategory
from question_global import QuestionGlobal
from question_option_association import QuestionOptionAssociation
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from survey import Survey


from .base import Base


class QuestionPerSurvey(Base):
    __tablename__ = "question_per_survey"

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    label: Mapped[str] = mapped_column(String)

    private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    question_category_uid: Mapped[int | None] = mapped_column(ForeignKey("question_category.uid"), nullable=True)
    question_category: Mapped[Optional["QuestionCategory"]] = relationship(
        "QuestionCategory", back_populates="questions_per_survey"
    )

    text_de: Mapped[str | None] = mapped_column(String, nullable=True)
    text_fr: Mapped[str | None] = mapped_column(String, nullable=True)
    text_it: Mapped[str | None] = mapped_column(String, nullable=True)
    text_rm: Mapped[str | None] = mapped_column(String, nullable=True)
    text_en: Mapped[str | None] = mapped_column(String, nullable=True)

    survey_uid: Mapped[int] = mapped_column(ForeignKey("survey.uid", ondelete="CASCADE"))
    survey: Mapped["Survey"] = relationship("Survey", back_populates="questions")

    question_global_uid: Mapped[int | None] = mapped_column(ForeignKey("question_global.uid"), nullable=True)
    question_global: Mapped[Optional["QuestionGlobal"]] = relationship(
        "QuestionGlobal", back_populates="questions_linked"
    )

    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="question")

    option_association: Mapped[list["QuestionOptionAssociation"]] = relationship(
        "QuestionOptionAssociation",
        back_populates="question",
        cascade="all, delete-orphan",
    )
