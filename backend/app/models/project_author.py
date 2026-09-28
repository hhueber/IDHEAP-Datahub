from project_author_association import ProjectAuthorAssociation
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class ProjectAuthor(Base):
    __tablename__ = "project_author"

    uid: Mapped[int] = mapped_column(primary_key=True)

    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)

    project_metadata_association: Mapped[list["ProjectAuthorAssociation"]] = relationship(
        "ProjectAuthorAssociation",
        back_populates="author",
        cascade="all, delete-orphan",
    )
