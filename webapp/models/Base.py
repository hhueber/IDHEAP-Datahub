from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    @classmethod
    def get_attributes(cls):
        return [attr for attr in vars(cls) if not attr.startswith("_") and not attr[0].isupper()]
