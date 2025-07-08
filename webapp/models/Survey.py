from typing import List


from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.QuestionPerSurvey import QuestionPerSurvey


class Survey(Base):
    """
    Represents a survey instance in the database.

    Attributes:
        uid        – Primary key identifier for this survey.
        name       – Unique code or name for the survey (e.g., 'GSB23').
        year       – Calendar year when the survey was conducted.
        questions  – List of QuestionPerSurvey records tied to this survey.
    """
    __tablename__ = "survey"

    uid: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    year: Mapped[int]

    questions: Mapped[List["QuestionPerSurvey"]] = relationship(back_populates="survey")

    @property
    def num_questions(self):
        """
        Return the number of questions in this survey,
        or None if there are no questions.
        """
        return len(self.questions) or None

    def __lt__(self, other):
        """
        Allow sorting Survey objects chronologically by year.
        """
        return self.year < other.year

    def __repr__(self):
        """
        Show the survey’s name and year.
        """
        return f"{self.name} ({self.year})"
