from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class SurveyAuthorAssociation(Base):
    __tablename__ = "survey_author_association"
    survey_metadata_uid: Mapped[int] = mapped_column(
        ForeignKey("survey_metadata.uid", ondelete="CASCADE"), primary_key=True
    )
    author_uid: Mapped[int] = mapped_column(ForeignKey("survey_author.uid", ondelete="CASCADE"), primary_key=True)

    survey_metadata: Mapped["SurveyMetadata"] = relationship(back_populates="author_association")
    author: Mapped["SurveyAuthor"] = relationship(back_populates="survey_metadata_association")
