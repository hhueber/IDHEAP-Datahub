from typing import List


from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from . import Base


class Project(Base):
    __tablename__ = "project"

    uid: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    surveys: Mapped[List["Survey"]] = relationship("Survey", back_populates="project")

    project_metadata_uid: Mapped[int] = mapped_column(
        ForeignKey("project_metadata.uid", ondelete="CASCADE"), nullable=False
    )
    project_metadata: Mapped["ProjectMetadata"] = relationship("ProjectMetadata", back_populates="project")
