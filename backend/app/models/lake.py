from typing import List, Optional


from geoalchemy2.types import Geometry
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class District(Base):
    __tablename__ = "lake"

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True)

    geometry: Mapped[Geometry] = mapped_column(Geometry)
