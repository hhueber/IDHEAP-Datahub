from typing import List


from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Answer import Answer
from webapp.models.Base import Base
from webapp.models.District import District


class Commune(Base):
    """
    Represents a Swiss municipality (‘commune’) in the database.

    Attributes:
        uid          – Primary key identifier for the commune.
        code         – Unique short code for the commune.
        name         – Official commune name.
        year         – Year the commune data reflects (default: 2023).
        name_de/...  – Translated commune names in German, French, Italian, Romansh, and English.
        district     – Relationship to the parent District.
        answers      – Collection of Answer objects submitted by this commune.
    """
    __tablename__ = "commune"

    uid: Mapped[int] = mapped_column(primary_key=True)

    code: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(unique=True)
    year: Mapped[int] = mapped_column(default=2023)

    name_de: Mapped[str]
    name_fr: Mapped[str]
    name_it: Mapped[str]
    name_ro: Mapped[str]
    name_en: Mapped[str]

    district_uid: Mapped[int] = mapped_column(ForeignKey("district.uid"))
    district: Mapped["District"] = relationship(back_populates="communes")

    @property
    def canton(self):
        """
        Convenient shortcut to access the Canton via the linked District.
        """
        return self.district.canton

    answers: Mapped[List["Answer"]] = relationship(back_populates="commune")

    def __repr__(self):
        """
        Show the commune’s name and code.
        """
        return f"{self.name} ({self.code})"
