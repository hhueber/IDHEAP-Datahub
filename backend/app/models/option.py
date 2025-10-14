from typing import Optional


from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Option(Base):
    __tablename__ = "option"

    uid: Mapped[int] = mapped_column(primary_key=True)
    value: Mapped[str] = mapped_column(String)

    question_category_uid: Mapped[int] = mapped_column(ForeignKey("question_category.uid", ondelete="CASCADE"))
    question_category: Mapped["QuestionCategory"] = relationship("QuestionCategory", back_populates="options")

    label_: Mapped[Optional[str]] = mapped_column("label", String, nullable=True)

    text_de: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_fr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_it: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_ro: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_en: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="option")

    @property
    def label(self) -> str:
        return self.label_ or self.value
