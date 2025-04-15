from flask import redirect, render_template


from webapp import get_locale
from webapp.main import bp


@bp.route("/map")
def map():
    return redirect("/")


@bp.route("/about")
def about():
    return render_template(f"public/about-{get_locale()}.html")


@bp.route("/data")
def data():
    return render_template(f"public/data.html")
