from geoalchemy2 import Geometry
from sqlalchemy import Boolean, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column


from .base import Base


class PlaceOfInterest(Base):
    __tablename__ = "PlaceOfInterest"
    __table_args__ = (UniqueConstraint("code", name="uq_PlaceOfInterest_code"),)

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String, nullable=False, index=True)  # unique, ex: "lausanne"
    default_name: Mapped[str] = mapped_column(String, nullable=False)

    name_fr: Mapped[str | None] = mapped_column(String, nullable=True)
    name_de: Mapped[str | None] = mapped_column(String, nullable=True)
    name_it: Mapped[str | None] = mapped_column(String, nullable=True)
    name_rm: Mapped[str | None] = mapped_column(String, nullable=True)
    name_en: Mapped[str | None] = mapped_column(String, nullable=True)

    # un seul point par ville (WGS84)
    geom: Mapped[Geometry] = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    # si utiliser plus tard : soft delete
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    @property
    def pos(self) -> tuple[float, float]:
        from geoalchemy2.shape import to_shape

        p = to_shape(self.geom)  # shapely Point
        return (float(p.y), float(p.x))  # [lat, lon]

    def set_pos(self, lat: float, lon: float):
        from geoalchemy2.shape import from_shape
        from shapely.geometry import Point

        self.geom = from_shape(Point(lon, lat), srid=4326)
