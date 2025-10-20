from typing import List, Optional


from geoalchemy2.types import Geometry
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Lake(Base):
    __tablename__ = "lake"

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)

    lake_map: Mapped[List["LakeMap"]] = relationship(
        "LakeMap",
        back_populates="lake",
        cascade="all, delete-orphan",
    )
