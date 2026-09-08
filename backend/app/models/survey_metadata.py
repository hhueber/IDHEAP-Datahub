from typing import Dict, List
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

    links_: Mapped[str] = mapped_column(String, nullable=False)

    author_association: Mapped[List["SurveyAuthorAssociation"]] = relationship(
        "SurveyAuthorAssociation", back_populates="survey_metadata", cascade="all, delete-orphan"
    )

    @property
    def links(self) -> List[Dict[str, str]]:
        if not self.links_:
            return []

        return_links = []
        pairs = self.links_.split(",")
        for pair in pairs:
            if "|" in pair:
                link_name, link_url = pair.split("|", 1)
                return_links.append({"name": link_name.strip(), "url": link_url.strip()})
        return return_links

    @links.setter
    def links(self, value: List[Dict[str, str]]):

        if not value:
            self.links_ = ""
        else:
            self.links_ = ",".join([f"{item['name']}|{item['url']}" for item in value])
