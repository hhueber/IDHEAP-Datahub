from typing import List


from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.Canton import Canton
from webapp.models.Commune import Commune


class District(Base):
    """
    Represents an administrative district within a Swiss canton.

    Attributes:
        uid           – Primary key identifier for this district.
        code          – Unique short code for the district.
        name          – Official district name.
        name_de/...   – Translated district names in German, French, Italian, Romansh, and English.
        canton        – Relationship to the parent Canton.
        communes      – Collection of Commune objects within this district.
    """    
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
        """
        Return the total number of communes in this district.
        """        
        return len(self.communes)

    def __repr__(self):
        """
        Show the district’s name and code.
        """
        return f"{self.name} ({self.code})"
