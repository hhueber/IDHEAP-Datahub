from logging import FileHandler, Formatter
import logging


from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy


def create_app():
    app = Flask(__name__)
    app.config.from_object("config")
    db = SQLAlchemy(app, model_class=Base)

    with app.app_context():
        db.reflect()

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

    @app.route("/")
    def home():
        return render_template("home.html")

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
