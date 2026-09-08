from typing import List


from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from . import QuestionPerSurvey
from .base import Base


class Survey(Base):
    __tablename__ = "survey"

    uid: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    year: Mapped[int] = mapped_column(Integer)

    questions: Mapped[List["QuestionPerSurvey"]] = relationship(
        "QuestionPerSurvey", back_populates="survey", cascade="all, delete-orphan"
    )

    survey_metadata: Mapped["SurveyMetadata"] = relationship("SurveyMetadata", back_populates="survey")

    project_uid: Mapped[int] = mapped_column(
        ForeignKey("project.uid", ondelete="CASCADE"), nullable=True
    )  # TODO When we will implement the project on the front and back change this to False, but i don't want to break everything now
    project: Mapped["Project"] = relationship("Project", back_populates="surveys")
