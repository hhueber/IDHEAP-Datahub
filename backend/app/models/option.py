from question_category_option_association import QuestionCategoryOptionAssociation
from question_global_option_association import QuestionGlobalOptionAssociation
from question_option_association import QuestionOptionAssociation
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Option(Base):
    __tablename__ = "option"

    uid: Mapped[int] = mapped_column(primary_key=True)
    value: Mapped[str] = mapped_column(String)

    label_: Mapped[str | None] = mapped_column("label", String, nullable=True)

    text_de: Mapped[str | None] = mapped_column(String, nullable=True)
    text_fr: Mapped[str | None] = mapped_column(String, nullable=True)
    text_it: Mapped[str | None] = mapped_column(String, nullable=True)
    text_rm: Mapped[str | None] = mapped_column(String, nullable=True)
    text_en: Mapped[str | None] = mapped_column(String, nullable=True)

    question_association: Mapped[list["QuestionOptionAssociation"]] = relationship(
        "QuestionOptionAssociation",
        back_populates="option",
        cascade="all, delete-orphan",
    )

    question_global_association: Mapped[list["QuestionGlobalOptionAssociation"]] = relationship(
        "QuestionGlobalOptionAssociation",
        back_populates="option",
        cascade="all, delete-orphan",
    )

    question_category_association: Mapped[list["QuestionCategoryOptionAssociation"]] = relationship(
        "QuestionCategoryOptionAssociation",
        back_populates="option",
        cascade="all, delete-orphan",
    )

    @property
    def label(self) -> str:
        return self.label_ or self.value

    @label.setter
    def label(self, value: str | None) -> None:
        self.label_ = value
