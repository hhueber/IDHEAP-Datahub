from flask import redirect, request, session, url_for
from flask_babel import Babel
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy


from webapp.models.Base import Base
from webapp.models.User import User


db = SQLAlchemy(model_class=Base)

# Login
login_manager = LoginManager()


@login_manager.user_loader
def user_loader(user_id):
    user = db.session.execute(db.select(User).where(User.uid == user_id)).one_or_none()
    if user:
        return user[0]
    return None


@login_manager.unauthorized_handler
def handle_needs_login():
    return redirect(url_for("login", next=request.endpoint))


# i18n
def get_locale():
    if "lang" not in session:
        session["lang"] = request.accept_languages.best_match(["fr", "de", "en"])
    if request.args.get("lang"):
        session["lang"] = request.args.get("lang")
    return session.get("lang") or "en"
