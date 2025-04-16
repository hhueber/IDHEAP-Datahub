from typing import List


from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.District import District


class Canton(Base):
    __tablename__ = "canton"

    uid: Mapped[int] = mapped_column(primary_key=True)

    code: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(unique=True)

    name_de: Mapped[str]
    name_fr: Mapped[str]
    name_it: Mapped[str]
    name_ro: Mapped[str]
    name_en: Mapped[str]

    districts: Mapped[List["District"]] = relationship(back_populates="canton")

    @property
    def num_districts(self):
        return len(self.districts)

    @property
    def num_communes(self):
        return sum(district.num_communes for district in self.districts)

    def __repr__(self):
        return f"{self.name} ({self.code})"
