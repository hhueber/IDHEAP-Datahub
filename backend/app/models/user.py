import uuid


from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.sql import func


from .base import Base


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="MEMBER")  # ADMIN | MEMBER ...
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_token_created_at = Column(DateTime(timezone=True), nullable=True)
