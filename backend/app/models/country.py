from geoalchemy2.types import Geometry
from sqlalchemy.orm import Mapped, mapped_column


from .base import Base


class Country(Base):
    __tablename__ = "country"

    uid: Mapped[int] = mapped_column(primary_key=True)

    geometry: Mapped[Geometry] = mapped_column(Geometry)
