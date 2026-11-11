from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .author_metadata_association import AuthorMetadataAssociation


class Author(Base):
    __tablename__ = "author"

    uid: Mapped[int] = mapped_column(primary_key=True)

    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)

    metadata_association: Mapped[list["AuthorMetadataAssociation"]] = relationship(
        "AuthorMetadataAssociation",
        back_populates="author",
        cascade="all, delete-orphan",
    )
