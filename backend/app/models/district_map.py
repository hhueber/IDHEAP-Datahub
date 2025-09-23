from geoalchemy2.types import Geometry
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.testing.schema import mapped_column


from .base import Base


class DistrictMap(Base):
    __tablename__ = "district_map"

    uid: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    district_id: Mapped[int] = mapped_column(ForeignKey("district.uid", ondelete="CASCADE"), nullable=False)

    type: Mapped[str] = mapped_column(String, nullable=False)

    geometry: Mapped[Geometry] = mapped_column(Geometry)

    district: Mapped["District"] = relationship("District", back_populates="district_map")
