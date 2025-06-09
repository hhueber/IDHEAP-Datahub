from sqlalchemy.orm import Mapped, mapped_column
from werkzeug.security import check_password_hash, generate_password_hash


from webapp.models.Base import Base


class User(Base):
    """
    Represents an application user with authentication credentials.

    Attributes:
        uid            – Primary key identifier for the user.
        username       – Unique username for login.
        email          – Unique email address for contact/notification.
        _password      – Hashed password stored securely.
        authenticated  – Boolean flag indicating if the user is currently authenticated.
    """
    __tablename__ = "user"

    uid: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
    email: Mapped[str] = mapped_column(unique=True)
    _password: Mapped[str]
    authenticated: Mapped[bool] = mapped_column(default=False)

    @property
    def password(self):
        """
        Disallow reading the password attribute directly.
        Raises an AttributeError to enforce write-only behavior.
        """
        raise AttributeError("You cannot read the password")

    @password.setter
    def password(self, value):
        """
        Hash the provided plain-text password and store it in `_password`.
        """
        self._password = generate_password_hash(password=value)

    def check_password(self, value):
        """
        Verify a plain-text password against the stored hash.
        Returns True if the password matches, False otherwise.
        """
        return check_password_hash(self._password, value)

    def is_active(self):
        """
        Return True if the user account is active.
        Always true in this implementation.
        """
        return True

    def get_id(self):
        """
        Return the unique identifier for Flask-Login integration.
        """
        return self.uid

    def is_authenticated(self):
        """
        Return the current authentication status of the user.
        """
        return self.authenticated

    def is_anonymous(self):
        """
        Return False because anonymous users are not supported.
        """
        return False
