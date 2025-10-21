from geoalchemy2 import Geometry
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.testing.schema import mapped_column


from . import Commune
from .base import Base


class CommuneMap(Base):
    __tablename__ = "commune_map"

    uid: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    geo_data_type: Mapped[str] = mapped_column(String, nullable=False)

    geometry: Mapped[Geometry] = mapped_column(Geometry)

    commune: Mapped["Commune"] = relationship("Commune", back_populates="commune_map")
    commune_uid: Mapped[int] = mapped_column(ForeignKey("commune.uid", ondelete="CASCADE"), nullable=False)
