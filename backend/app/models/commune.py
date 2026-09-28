from answer import Answer
from canton import Canton
from commune_map import CommuneMap
from district import District
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


from .base import Base


class Commune(Base):
    __tablename__ = "commune"

    uid: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)

    name_de: Mapped[str | None] = mapped_column(String, nullable=True)
    name_fr: Mapped[str | None] = mapped_column(String, nullable=True)
    name_it: Mapped[str | None] = mapped_column(String, nullable=True)
    name_rm: Mapped[str | None] = mapped_column(String, nullable=True)
    name_en: Mapped[str | None] = mapped_column(String, nullable=True)

    district_uid: Mapped[int] = mapped_column(ForeignKey("district.uid", ondelete="CASCADE"))
    district: Mapped["District"] = relationship("District", back_populates="communes")

    commune_map: Mapped[list["CommuneMap"]] = relationship(
        "CommuneMap", back_populates="commune", cascade="all, delete-orphan"
    )

    @property
    def canton(self) -> "Canton":
        return self.district.canton

    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="commune")
