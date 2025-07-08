from typing import List, Optional


from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.QuestionCategory import QuestionCategory
from webapp.models.QuestionPerSurvey import QuestionPerSurvey


class QuestionGlobal(Base):
    """
    Represents a high-level, thematic survey question that spans multiple survey waves.
    
    Attributes:
        uid                     – Primary key for the global question record.
        label                   – Core label or code identifying this global theme.
        question_category       – (Optional) Foreign key link to a QuestionCategory defining answer options.
        text_de/.../text_en     – Optional translations of the global question label.
        questions_linked        – All QuestionPerSurvey instances mapped to this global theme.
    """
    __tablename__ = "question_global"

    uid: Mapped[int] = mapped_column(primary_key=True)

    label: Mapped[str]

    # Optional
    question_category_uid: Mapped[Optional[int]] = mapped_column(ForeignKey("question_category.uid"))
    question_category: Mapped["QuestionCategory"] = relationship(back_populates="questions_global")

    text_de: Mapped[Optional[str]]
    text_fr: Mapped[Optional[str]]
    text_it: Mapped[Optional[str]]
    text_ro: Mapped[Optional[str]]
    text_en: Mapped[Optional[str]]

    questions_linked: Mapped[List["QuestionPerSurvey"]] = relationship(back_populates="question_global")

    @property
    def linked_surveys(self):
        """
        Return a unique list of survey identifiers in which this global question appears.
        """
        return list(set([question.survey for question in self.questions_linked]))

    def __repr__(self):
        """
        Show the global question UID and label.
        """
        return f"Question Global #{self.uid}"
