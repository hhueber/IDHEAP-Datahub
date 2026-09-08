from typing import Dict, List


from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from . import Base


class ProjectMetadata(Base):
    __tablename__ = "project_metadata"

    uid: Mapped[int] = mapped_column(primary_key=True)

    description: Mapped[str] = mapped_column(String)
    licence: Mapped[str] = mapped_column(String)
    links_: Mapped[str] = mapped_column(String)

    project: Mapped["Project"] = relationship("Project", back_populates="project_metadata")

    author_association: Mapped[List["ProjectAuthorAssociation"]] = relationship(
        "ProjectAuthorAssociation", back_populates="project_metadata", cascade="all, delete-orphan"
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
