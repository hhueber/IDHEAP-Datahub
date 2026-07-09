import enum


from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class GranularityEnum(enum.Enum):
    COMMUNE = "COMMUNE"
    DISTRICT = "DISTRICT"
    CANTON = "CANTON"


class SurveyMetadata(Base):
    __tablename__ = "survey_metadata"

    uid: Mapped[int] = mapped_column(primary_key=True)

    survey_uid: Mapped[int] = mapped_column(ForeignKey("survey.uid", ondelete="CASCADE"), nullable=False)
    survey: Mapped["Survey"] = relationship("Survey", back_populates="survey_metadata")

    name: Mapped[str] = mapped_column(String, nullable=False)
    granularity: Mapped[GranularityEnum] = mapped_column(Enum(GranularityEnum))
    license: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)

    links: Mapped[str] = mapped_column(String, nullable=False)
    authors: Mapped[list["SurveyAuthor"]] = relationship("SurveyAuthor", back_populates="survey_metadata")
