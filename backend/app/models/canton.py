from typing import List, Optional


from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Canton(Base):
    __tablename__ = "canton"

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    # ofs_id: Mapped[int] = mapped_column(Integer) # TODO: la version actuelle si on laisse cette ligne on a un crash mais cecis est corriger plus tard

    name_de: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_fr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_it: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_ro: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_en: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    districts: Mapped[List["District"]] = relationship(
        "District", back_populates="canton", cascade="all, delete-orphan"
    )

    @property
    def communes(self) -> List["Commune"]:
        return [c for d in self.districts for c in d.communes]
