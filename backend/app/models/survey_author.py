from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class SurveyAuthor(Base):
    __tablename__ = "survey_author"

    uid: Mapped[int] = mapped_column(primary_key=True)

    survey_metadata_uid: Mapped[int] = mapped_column(
        ForeignKey("survey_metadata.uid", ondelete="CASCADE"), nullable=False
    )
    survey_metadata: Mapped["SurveyMetadata"] = relationship("SurveyMetadata", back_populates="authors")

    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
