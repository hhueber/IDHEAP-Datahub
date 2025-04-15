from flask import Flask, render_template
from flask_babel import Babel


from webapp.admin import bp as admin_bp
from webapp.config import Config
from webapp.dash_map import create_dash_map
from webapp.extensions import db, get_locale, login_manager
from webapp.login import bp as login_bp
from webapp.main import bp as main_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Flask extensions here
    db.init_app(app)
    with app.app_context():
        db.reflect()
    login_manager.init_app(app)
    babel = Babel(app, locale_selector=get_locale)
    app.jinja_env.globals["get_locale"] = get_locale

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

    # Register blueprints here
    app.register_blueprint(main_bp)
    app.register_blueprint(login_bp, url_prefix="login")
    app.register_blueprint(admin_bp, url_prefix="admin")

    # Register map dashboard
    app = create_dash_map(app, "/")

    return app
