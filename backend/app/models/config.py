from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column


from .base import Base


class Config(Base):
    __tablename__ = "config"

    # ex: "instance_name", "colour_light_primary", "logo_url"
    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
