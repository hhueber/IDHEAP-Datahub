from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .metadata import Metadata
    from .survey import Survey


class Project(Base):
    __tablename__ = "project"

    uid: Mapped[int] = mapped_column(primary_key=True)

    surveys: Mapped[list["Survey"]] = relationship("Survey", back_populates="project")

    metadatas: Mapped["Metadata"] = relationship(
        "Metadata",
        back_populates="project",
        cascade="all, delete-orphan",
    )
