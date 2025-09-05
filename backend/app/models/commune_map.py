from geoalchemy2 import Geometry
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.testing.schema import mapped_column
from tomlkit.items import Integer, String


from . import Commune
from .base import Base


class CommuneMap(Base):
    __tablename__ = "commune_map"

    uid: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    type: Mapped[str] = mapped_column(String, nullable=False)

    geometry: Mapped[Geometry] = mapped_column(Geometry)

    commune: Mapped["Commune"] = relationship("Commune", back_populates="commune_map")
