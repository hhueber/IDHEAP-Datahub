from typing import List, Optional


from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class District(Base):
    __tablename__ = "district"

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True)

    name_de: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_fr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_it: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_ro: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name_en: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    canton_uid: Mapped[int] = mapped_column(ForeignKey("canton.uid", ondelete="CASCADE"))
    canton: Mapped["Canton"] = relationship("Canton", back_populates="districts")

    communes: Mapped[List["Commune"]] = relationship("Commune", back_populates="district", cascade="all, delete-orphan")
