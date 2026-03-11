from typing import List, Optional


from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Option(Base):
    __tablename__ = "option"

    uid: Mapped[int] = mapped_column(primary_key=True)
    value: Mapped[str] = mapped_column(String)

    label_: Mapped[Optional[str]] = mapped_column("label", String, nullable=True)

    text_de: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_fr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_it: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_ro: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_en: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    question_association: Mapped[List["QuestionOptionAssociation"]] = relationship(
        "QuestionOptionAssociation", back_populates="option", cascade="all, delete-orphan"
    )

    question_global_association: Mapped[List["QuestionGlobalOptionAssociation"]] = relationship(
        "QuestionGlobalOptionAssociation", back_populates="option", cascade="all, delete-orphan"
    )

    question_category_association: Mapped[List["QuestionCategoryOptionAssociation"]] = relationship(
        "QuestionCategoryOptionAssociation", back_populates="option", cascade="all, delete-orphan"
    )

    @property
    def label(self) -> str:
        return self.label_ or self.value

    @label.setter
    def label(self, value: Optional[str]) -> None:
        self.label_ = value
