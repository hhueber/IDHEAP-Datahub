from flask import Blueprint


bp = Blueprint("admin", __name__)

from webapp.admin import routes
