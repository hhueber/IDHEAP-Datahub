from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .metadata import Metadata
    from .project import Project
    from .question_per_survey import QuestionPerSurvey


class Survey(Base):
    __tablename__ = "survey"

    uid: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer)

    questions: Mapped[list["QuestionPerSurvey"]] = relationship(
        "QuestionPerSurvey", back_populates="survey", cascade="all, delete-orphan"
    )

    metadatas: Mapped["Metadata"] = relationship(
        "Metadata",
        back_populates="survey",
        cascade="all, delete-orphan",
    )

    project_uid: Mapped[int] = mapped_column(
        ForeignKey("project.uid", ondelete="CASCADE"), nullable=True
    )

    project: Mapped["Project"] = relationship("Project", back_populates="surveys")
