from typing import List


from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Survey(Base):
    __tablename__ = "survey"

    uid: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    year: Mapped[int] = mapped_column(Integer)

    questions: Mapped[List["QuestionPerSurvey"]] = relationship(
        "QuestionPerSurvey", back_populates="survey", cascade="all, delete-orphan"
    )
