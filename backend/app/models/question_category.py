from question_category_option_association import QuestionCategoryOptionAssociation
from question_global import QuestionGlobal
from question_per_survey import QuestionPerSurvey
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class QuestionCategory(Base):
    __tablename__ = "question_category"

    uid: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String, unique=True)

    text_de: Mapped[str | None] = mapped_column(String, nullable=True)
    text_fr: Mapped[str | None] = mapped_column(String, nullable=True)
    text_it: Mapped[str | None] = mapped_column(String, nullable=True)
    text_rm: Mapped[str | None] = mapped_column(String, nullable=True)
    text_en: Mapped[str | None] = mapped_column(String, nullable=True)

    option_association: Mapped[list["QuestionCategoryOptionAssociation"]] = relationship(
        "QuestionCategoryOptionAssociation",
        back_populates="question",
        cascade="all, delete-orphan",
    )

    questions_global: Mapped[list["QuestionGlobal"]] = relationship(
        "QuestionGlobal", back_populates="question_category"
    )
    questions_per_survey: Mapped[list["QuestionPerSurvey"]] = relationship(
        "QuestionPerSurvey", back_populates="question_category"
    )
