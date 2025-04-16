from flask import render_template


from webapp.main import bp


@bp.route("/dashboard")
def dashboard():
    return render_template("index.html")
