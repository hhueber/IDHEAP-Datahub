from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .granularity import GranularityEnum

if TYPE_CHECKING:
    from .author_metadata_association import AuthorMetadataAssociation
    from .project import Project
    from .survey import Survey


class Metadata(Base):
    __tablename__ = "metadatas"

    uid: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String)
    licence: Mapped[str] = mapped_column(String)
    links_: Mapped[str] = mapped_column(String)

    granularity: Mapped[GranularityEnum] = mapped_column(Enum(GranularityEnum))

    author_association: Mapped[list["AuthorMetadataAssociation"]] = relationship(
        "AuthorMetadataAssociation",
        back_populates="metadatas",
        cascade="all, delete-orphan",
    )

    project_uid: Mapped[int] = mapped_column(
        ForeignKey("project.uid", ondelete="CASCADE"), nullable=True
    )

    survey_uid: Mapped[int] = mapped_column(
        ForeignKey("survey.uid", ondelete="CASCADE"), nullable=True
    )

    project: Mapped["Project"] = relationship("Project", back_populates="metadatas")

    survey: Mapped["Survey"] = relationship(
        "Survey",
        back_populates="metadatas",
    )

    @property
    def links(self) -> list[dict[str, str]]:
        """
        We store link as follow name1|url1,name2|url2
        We use it that way cause its easier to identify tuple visually than juste putting coma everywhere and easier to handler
        """
        if not self.links_:
            return []

        return_links = []
        pairs = self.links_.split(",")
        for pair in pairs:
            if "|" in pair:
                link_name, link_url = pair.split("|", 1)
                return_links.append(
                    {"name": link_name.strip(), "url": link_url.strip()}
                )
        return return_links

    @links.setter
    def links(self, value: list[list[str, str]]):
        """
        We store link as follow name1|url1,name2|url2
        We use it that way cause its easier to identify tuple visually than juste putting coma everywhere and easier to handler
        """
        if not value:
            self.links_ = ""
        else:
            self.links_ = ",".join([f"{item['name']}|{item['url']}" for item in value])
