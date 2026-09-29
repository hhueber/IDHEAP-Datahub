from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .option import Option
    from .question_category import QuestionCategory


class QuestionCategoryOptionAssociation(Base):
    __tablename__ = "question_category_option_association"
    question_uid: Mapped[int] = mapped_column(
        ForeignKey("question_category.uid", ondelete="CASCADE"), primary_key=True
    )
    option_uid: Mapped[int] = mapped_column(
        ForeignKey("option.uid", ondelete="CASCADE"), primary_key=True
    )

    question: Mapped["QuestionCategory"] = relationship(
        back_populates="option_association"
    )
    option: Mapped["Option"] = relationship(
        back_populates="question_category_association"
    )
