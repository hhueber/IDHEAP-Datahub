from typing import List, Optional


from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Commune(Base):
    __tablename__ = "commune"

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)

    name_de: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_fr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_it: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_ro: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_en: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    district_uid: Mapped[int] = mapped_column(ForeignKey("district.uid", ondelete="CASCADE"))
    district: Mapped["District"] = relationship("District", back_populates="communes")

    commune_map: Mapped[List["CommuneMap"]] = relationship("CommuneMap", back_populates="commune")

    @property
    def canton(self) -> "Canton":
        return self.district.canton

    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="commune")
