from typing import Optional, List, Tuple
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, UniqueConstraint
from geoalchemy2 import Geometry
from .base import Base

class City(Base):
    __tablename__ = "city"
    __table_args__ = (UniqueConstraint("code", name="uq_city_code"),)

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String, nullable=False, index=True)  # unique, ex: "lausanne"
    default_name: Mapped[str] = mapped_column(String, nullable=False)

    name_fr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_de: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_it: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_ro: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_en: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # un seul point par ville (WGS84)
    geom: Mapped[Geometry] = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    # si utiliser plus tard : soft delete
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    @property
    def pos(self) -> Tuple[float, float]:
        from geoalchemy2.shape import to_shape
        p = to_shape(self.geom)  # shapely Point
        return (float(p.y), float(p.x))  # [lat, lon]

    def set_pos(self, lat: float, lon: float):
        from geoalchemy2.shape import from_shape
        from shapely.geometry import Point
        self.geom = from_shape(Point(lon, lat), srid=4326)
