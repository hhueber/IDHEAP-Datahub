import uuid


from app.config.roles import Role, ROLE_VALUES
from sqlalchemy import Column, DateTime
from sqlalchemy import Enum as SAEnum
from sqlalchemy import String, Text
from sqlalchemy.sql import func


from .base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(
        SAEnum(*ROLE_VALUES, name="user_role", native_enum=False),
        nullable=False,
        server_default="MEMBER",
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_token_created_at = Column(
        DateTime(timezone=True), nullable=True  # volontairement NULL possible : on efface la date au logout
    )
