from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class QuestionOptionAssociation(Base):
    __tablename__ = "question_option_association"
    question_uid: Mapped[int] = mapped_column(
        ForeignKey("question_per_survey.uid", ondelete="CASCADE"), primary_key=True
    )
    option_uid: Mapped[int] = mapped_column(ForeignKey("option.uid", ondelete="CASCADE"), primary_key=True)

    question: Mapped["QuestionPerSurvey"] = relationship(back_populates="option_association")
    option: Mapped["Option"] = relationship(back_populates="question_association")
