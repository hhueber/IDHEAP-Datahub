from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all ORM models in the application.
    Inherits from SQLAlchemy's DeclarativeBase to provide metadata and
    shared functionality across all table-mapped classes.
    """
    @classmethod
    def get_attributes(cls):
        """
        Return a list of public, instance-level attribute names defined on the model.
        
        - Excludes any attribute whose name starts with an underscore (private/magic).
        - Excludes any attribute beginning with an uppercase letter (class-level constants or SQLAlchemy internals).
        """
        return [attr for attr in vars(cls) if not attr.startswith("_") and not attr[0].isupper()]
