from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .author import Author
    from .metadata import Metadata


class AuthorMetadataAssociation(Base):
    __tablename__ = "author_metadata_association"

    uid: Mapped[int] = mapped_column(primary_key=True)

    metadata_uid: Mapped[int] = mapped_column(
        ForeignKey("metadatas.uid", ondelete="CASCADE"), primary_key=True
    )

    author_uid = mapped_column(
        ForeignKey("author.uid", ondelete="CASCADE"), primary_key=True
    )

    metadatas: Mapped["Metadata"] = relationship(back_populates="author_association")

    author: Mapped["Author"] = relationship(back_populates="metadata_association")
