import os

BASEDIR = os.path.abspath(os.path.dirname(__file__))
DEBUG = True
SECRET_KEY = "CHANGE THAT"

SERVER_HOST = "localhost"
SERVER_PORT = 8888

DB_ENGINE = "sqlite"
DB_USERNAME = ""
DB_PASSWORD = ""
DB_HOST = ""
DB_PORT = ""
DB_NAME = os.path.join(BASEDIR, "secom.db")
if DB_ENGINE == "sqlite":
    DB_URI = f"sqlite:///{DB_NAME}"
else:
    DB_URI = f"{DB_ENGINE}://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

SQLALCHEMY_DATABASE_URI = DB_URI
SQLALCHEMY_TRACK_MODIFICATIONS = DEBUG
