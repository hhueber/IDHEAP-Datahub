from geoalchemy2 import Geometry
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.testing.schema import mapped_column


from . import Canton
from .base import Base


class CantonMap(Base):
    __tablename__ = "canton_map"

    uid: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    type: Mapped[str] = mapped_column(String, nullable=False)

    geometry: Mapped[Geometry] = mapped_column(Geometry)

    canton: Mapped[Canton] = relationship("Canton", back_populates="canton_map")
