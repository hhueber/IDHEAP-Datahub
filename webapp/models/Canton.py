from typing import List


from sqlalchemy.orm import Mapped, mapped_column, relationship


from webapp.models.Base import Base
from webapp.models.District import District


class Canton(Base):
    """
    Represents a Swiss canton (state) in our database.

    Attributes:
        uid           – Primary key for the canton.
        code          – Unique short code identifying the canton.
        name          – Official canton name.
        name_de/fr/it/ro/en – Translated names in German, French, Italian, Romansh, and English.
        districts     – Collection of District objects belonging to this canton.
    """
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
        """
        Return the number of districts in this canton.
        """
        return len(self.districts)

    @property
    def num_communes(self):
        """
        Sum up the total number of communes across all districts in this canton.
        """
        return sum(district.num_communes for district in self.districts)

    def __repr__(self):
        """
        Show the canton’s name and code.
        """
        return f"{self.name} ({self.code})"
