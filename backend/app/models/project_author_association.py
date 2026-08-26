from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class ProjectAuthorAssociation(Base):
    __tablename__ = "project_author_association"
    project_metadata_uid: Mapped[int] = mapped_column(
        ForeignKey("project_metadata.uid", ondelete="CASCADE"), primary_key=True
    )
    author_uid: Mapped[int] = mapped_column(ForeignKey("project_author.uid", ondelete="CASCADE"), primary_key=True)

    project_metadata: Mapped["ProjectMetadata"] = relationship(back_populates="author_association")
    author: Mapped["ProjectAuthor"] = relationship(back_populates="project_metadata_association")
