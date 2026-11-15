from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .project_metadata import ProjectMetadata
    from .survey import Survey


class Project(Base):
    __tablename__ = "project"

    uid: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    surveys: Mapped[list["Survey"]] = relationship("Survey", back_populates="project")

    project_metadata_uid: Mapped[int] = mapped_column(
        ForeignKey("project_metadata.uid", ondelete="CASCADE"), nullable=False
    )
    project_metadata: Mapped["ProjectMetadata"] = relationship(
        "ProjectMetadata", back_populates="project"
    )
