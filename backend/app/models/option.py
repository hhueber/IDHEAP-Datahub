from typing import Optional


from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Option(Base):
    __tablename__ = "option"

    uid: Mapped[int] = mapped_column(primary_key=True)
    value: Mapped[str] = mapped_column(String)

    question_category_uid: Mapped[int] = mapped_column(ForeignKey("question_category.uid", ondelete="CASCADE"))
    question_category: Mapped["QuestionCategory"] = relationship("QuestionCategory", back_populates="option")

    label_: Mapped[Optional[str]] = mapped_column("label", String, nullable=True)

    text_de: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_fr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_it: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_ro: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_en: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    question_global_uid: Mapped[Optional[int]] = mapped_column(ForeignKey("question_global.uid", ondelete="CASCADE"))
    question_global: Mapped[Optional["QuestionGlobal"]] = relationship("QuestionGlobal", back_populates="option")

    question_uid: Mapped[int] = mapped_column(ForeignKey("question_per_survey.uid", ondelete="CASCADE"))
    question: Mapped["QuestionPerSurvey"] = relationship("QuestionPerSurvey", back_populates="option")

    @property
    def label(self) -> str:
        return self.label_ or self.value
