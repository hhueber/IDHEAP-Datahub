from sqlalchemy.orm import Mapped, mapped_column
from werkzeug.security import check_password_hash, generate_password_hash


from webapp.models.Base import Base


class User(Base):
    __tablename__ = "user"

    uid: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
    email: Mapped[str] = mapped_column(unique=True)
    _password: Mapped[str]
    authenticated: Mapped[bool] = mapped_column(default=False)

    @property
    def password(self):
        raise AttributeError("You cannot read the password")

    @password.setter
    def password(self, value):
        self._password = generate_password_hash(password=value)

    def check_password(self, value):
        return check_password_hash(self._password, value)

    def is_active(self):
        return True

    def get_id(self):
        return self.uid

    def is_authenticated(self):
        return self.authenticated

    def is_anonymous(self):
        # False, as anonymous users aren't supported.
        return False
