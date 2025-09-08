from typing import List, Optional


from geoalchemy2.types import Geometry
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Country(Base):
    __tablename__ = "country"

    uid: Mapped[int] = mapped_column(primary_key=True)

    geometry: Mapped[Geometry] = mapped_column(Geometry)
