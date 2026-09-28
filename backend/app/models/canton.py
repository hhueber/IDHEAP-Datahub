from canton_map import CantonMap
from commune import Commune
from district import District
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Canton(Base):
    __tablename__ = "canton"

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    ofs_id: Mapped[int] = mapped_column(Integer)

    name_de: Mapped[str | None] = mapped_column(String, nullable=True)
    name_fr: Mapped[str | None] = mapped_column(String, nullable=True)
    name_it: Mapped[str | None] = mapped_column(String, nullable=True)
    name_rm: Mapped[str | None] = mapped_column(String, nullable=True)
    name_en: Mapped[str | None] = mapped_column(String, nullable=True)

    districts: Mapped[list["District"]] = relationship(
        "District", back_populates="canton", cascade="all, delete-orphan"
    )
    canton_map: Mapped[list["CantonMap"]] = relationship("CantonMap", back_populates="canton")

    @property
    def communes(self) -> list["Commune"]:
        return [c for d in self.districts for c in d.communes]
