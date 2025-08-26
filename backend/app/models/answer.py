from typing import Optional


from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Answer(Base):
    __tablename__ = "answer"

    uid: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer)

    question_uid: Mapped[int] = mapped_column(ForeignKey("question_per_survey.uid", ondelete="CASCADE"))
    question: Mapped["QuestionPerSurvey"] = relationship(back_populates="answers")

    commune_uid: Mapped[int] = mapped_column(ForeignKey("commune.uid", ondelete="CASCADE"))
    commune: Mapped["Commune"] = relationship(back_populates="answers")

    option_uid: Mapped[Optional[int]] = mapped_column(ForeignKey("option.uid"), nullable=True)
    option: Mapped[Optional["Option"]] = relationship(back_populates="answers")

    value: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("question_uid", "commune_uid", "year"),
        CheckConstraint("(option_uid IS NULL) <> (value IS NULL)", name="answer_xor_option_value"),
    )
