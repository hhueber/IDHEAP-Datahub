from geoalchemy2.types import Geometry
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.testing.schema import mapped_column


from . import Lake
from .base import Base


class LakeMap(Base):
    __tablename__ = "lake_map"

    uid: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    lake_id: Mapped[int] = mapped_column(ForeignKey("lake.uid", ondelete="CASCADE"), nullable=False)
    lake: Mapped["Lake"] = relationship("Lake", back_populates="lake_map")

    geo_data_type: Mapped[str] = mapped_column(String, nullable=False)

    geometry: Mapped[Geometry] = mapped_column(Geometry)
