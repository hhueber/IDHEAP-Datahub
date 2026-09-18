from canton import Canton
from commune import Commune
from district_map import DistrictMap
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class District(Base):
    __tablename__ = "district"

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)

    name_de: Mapped[str | None] = mapped_column(String, nullable=True)
    name_fr: Mapped[str | None] = mapped_column(String, nullable=True)
    name_it: Mapped[str | None] = mapped_column(String, nullable=True)
    name_rm: Mapped[str | None] = mapped_column(String, nullable=True)
    name_en: Mapped[str | None] = mapped_column(String, nullable=True)

    canton_uid: Mapped[int] = mapped_column(ForeignKey("canton.uid", ondelete="CASCADE"))
    canton: Mapped["Canton"] = relationship("Canton", back_populates="districts")

    district_map: Mapped[list["DistrictMap"]] = relationship(
        "DistrictMap", back_populates="district", cascade="all, delete-orphan"
    )

    communes: Mapped[list["Commune"]] = relationship("Commune", back_populates="district", cascade="all, delete-orphan")
