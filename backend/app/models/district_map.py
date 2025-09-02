from geoalchemy2.types import Geometry
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.testing.schema import mapped_column
from tomlkit.items import Integer


from .base import Base


class DistrictMap(Base):
    __tablename__ = "district_map"

    uid: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    geometry: Mapped[Geometry] = mapped_column(Geometry)

    district: Mapped["District"] = relationship("District", back_populates="district_map")
