from typing import List


from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class SurveyAuthor(Base):
    __tablename__ = "survey_author"

    uid: Mapped[int] = mapped_column(primary_key=True)

    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)

    survey_metadata_association: Mapped[List["SurveyAuthorAssociation"]] = relationship(
        "SurveyAuthorAssociation", back_populates="author", cascade="all, delete-orphan"
    )
