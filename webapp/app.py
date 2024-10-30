from logging import FileHandler, Formatter
import logging
import os.path


from flask import (
    abort,
    flash,
    Flask,
    redirect,
    render_template,
    request,
    send_file,
    send_from_directory,
    session,
    url_for,
)
from flask_babel import _, Babel
from flask_login import login_required, login_user, LoginManager, logout_user
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash
import flask


if __name__ == "__main__":
    from config import BASEDIR
    from database import Base, Canton, Commune, District, QuestionGlobal, QuestionPerSurvey, Survey, User
else:
    from .config import BASEDIR
    from .database import Base, Canton, Commune, District, QuestionGlobal, QuestionPerSurvey, Survey, User


def create_app():
    app = Flask(__name__)
    if __name__ == "__main__":
        app.config.from_object("config")
    else:
        app.config.from_object("webapp.config")

    # Database
    db = SQLAlchemy(app, model_class=Base)
    with app.app_context():
        db.reflect()

    # Login
    login_manager = LoginManager()
    login_manager.init_app(app)

    # i18n
    app.config["LANGUAGES"] = ["fr", "en", "de", "it", "rm"]
    app.config["BABEL_DEFAULT_LOCALE"] = "fr"

    def get_locale():
        if "lang" not in session:
            session["lang"] = request.accept_languages.best_match(["fr", "de", "en"])
        if request.args.get("lang"):
            session["lang"] = request.args.get("lang")
        return session.get("lang", "en")

    babel = Babel(app, locale_selector=get_locale)
    app.jinja_env.globals["get_locale"] = get_locale

    @login_manager.user_loader
    def user_loader(user_id):
        user = db.session.execute(db.select(User).where(User.uid == user_id)).one_or_none()
        if user:
            return user[0]
        return None

    @login_manager.unauthorized_handler
    def handle_needs_login():
        return redirect(url_for("login", next=request.endpoint))

    # Error handlers
    @app.errorhandler(403)
    def error_forbidden(error):
        return render_template("errors/40x.html"), 403

    @app.errorhandler(404)
    def error_not_found(error):
        return render_template("errors/40x.html"), 404

    @app.errorhandler(500)
    def error_internal(error):
        return render_template("errors/50x.html"), 500

    # Login
    @app.route("/login", methods=("GET", "POST"))
    def login():
        if request.method == "POST":
            username = request.form.get("username")
            password = request.form.get("password")
            user = db.session.execute(db.select(User).where(User.username == username)).one_or_none()

            if user and user[0].check_password(password):
                login_user(user[0])
                flash(_("Logged in successfully."), "success")
                next_url = flask.request.args.get("next")
                return redirect(next_url or url_for("home"))
            else:
                flash(_("Problem while loging in."), "warning")

        return render_template("login.html")

    @app.route("/logout")
    @login_required
    def logout():
        logout_user()
        return redirect(url_for("home"))

    # Homepage, with default visualisation
    @app.route("/")
    def map():
        return render_template("public/home.html")

    # Data download
    @app.route("/data")
    def data():
        if request.args.get("dl"):
            dl = request.args.get("dl")
            match dl:  # TODO
                case "test":
                    path = os.path.join(BASEDIR, "public_data", "empty.csv")
                case _:
                    path = os.path.join(BASEDIR, "public_data", "empty.csv")
            return send_file(path, as_attachment=True)

        years = [1988, 1994, 1998, 2005, 2009, 2017, 2023]
        return render_template("public/data.html", years=years)

    # Links to other parts of the website
    @app.route("/about")
    def about():
        return render_template(f"public/about-{get_locale()}.html")

    @app.route("/dashboard")
    @login_required
    def dashboard():
        return render_template("placeholder.html")

    # Survey
    @app.route("/survey/new", methods=("GET", "POST"))
    @login_required
    def survey_new():
        pass

    @app.route("/survey/list")
    @login_required
    def survey_list():
        surveys = db.session.execute(db.select(Survey).order_by(Survey.year)).scalars()
        return render_template("surveys/survey_list.html", liste=surveys)

    @app.route("/survey/<uid>")
    @login_required
    def survey_show(uid):
        survey = db.session.execute(db.select(Survey).where(Survey.uid == uid)).one_or_none()
        questions = db.session.execute(
            db.select(QuestionPerSurvey).where(QuestionPerSurvey.survey_uid == uid)
        ).scalars()
        if survey:
            return render_template("surveys/survey_show.html", item=survey[0], liste=questions)
        else:
            abort(404)

    # Questions
    @app.route("/questions/qps/list")
    @login_required
    def qps_list():
        qps = db.session.execute(db.select(QuestionPerSurvey)).scalars()
        return render_template("questions/qps_list.html", liste=qps)

    @app.route("/questions/qg/list")
    @login_required
    def qg_list():
        qg = db.session.execute(db.select(QuestionGlobal)).scalars()
        return render_template("questions/qg_list.html", liste=qg)

    # Answers

    # Places
    @app.route("/places/canton/list")
    @login_required
    def canton_list():
        cantons = db.session.execute(db.select(Canton).order_by(Canton.code)).scalars()
        return render_template("places/canton_list.html", liste=cantons)

    @app.route("/places/district/list")
    @login_required
    def district_list():
        districts = db.session.execute(db.select(District).order_by(District.code)).scalars()
        return render_template("places/district_list.html", liste=districts)

    @app.route("/places/commune/list")
    @login_required
    def commune_list():
        communes = db.session.execute(db.select(Commune).order_by(Commune.code)).scalars()
        return render_template("places/commune_list.html", liste=communes)

    @app.route("/config")
    @login_required
    def config():  # TODO
        return render_template("placeholder.html")

    from map import create_dash_app

    app = create_dash_app(app)

    if not app.debug:
        file_handler = FileHandler("error.log")
        file_handler.setFormatter(Formatter("%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"))
        app.logger.setLevel(logging.INFO)
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.info("errors")

    return app


# Default port:
if __name__ == "__main__":
    from config import SERVER_HOST, SERVER_PORT

    app = create_app()
    app.run(host=SERVER_HOST, port=SERVER_PORT)
