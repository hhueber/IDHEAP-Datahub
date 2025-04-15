from typing import List


from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.Canton import Canton
from webapp.models.Commune import Commune


class District(Base):
    __tablename__ = "district"

    uid: Mapped[int] = mapped_column(primary_key=True)

    code: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(unique=True)

    name_de: Mapped[str]
    name_fr: Mapped[str]
    name_it: Mapped[str]
    name_ro: Mapped[str]
    name_en: Mapped[str]

    canton_uid: Mapped[int] = mapped_column(ForeignKey("canton.uid"))
    canton: Mapped["Canton"] = relationship(back_populates="districts")

    communes: Mapped[List["Commune"]] = relationship(back_populates="district")

    @property
    def num_communes(self):
        return len(self.communes)

    def __repr__(self):
        return f"{self.name} ({self.code})"
