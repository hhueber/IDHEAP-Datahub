from typing import List


from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.QuestionPerSurvey import QuestionPerSurvey


class Survey(Base):
    __tablename__ = "survey"

    uid: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    year: Mapped[int]

    questions: Mapped[List["QuestionPerSurvey"]] = relationship(back_populates="survey")

    @property
    def num_questions(self):
        return len(self.questions) or None

    def __lt__(self, other):
        return self.year < other.year

    def __repr__(self):
        return f"{self.name} ({self.year})"
