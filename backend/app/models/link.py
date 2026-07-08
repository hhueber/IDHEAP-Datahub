from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Link(Base):
    __tablename__ = "link"

    uid: Mapped[int] = mapped_column(primary_key=True)

    survey_metadata_uid: Mapped[int] = mapped_column(
        ForeignKey("survey_metadata.uid", ondelete="CASCADE"), nullable=False
    )
    survey_metadata: Mapped["SurveyMetadata"] = relationship("SurveyMetadata", back_populates="links")

    name: Mapped[int] = mapped_column(String)
    url: Mapped[int] = mapped_column(String)
