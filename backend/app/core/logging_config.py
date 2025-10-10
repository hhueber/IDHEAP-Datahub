import logging
import os


def configure_logging() -> None:
    level = os.getenv("LOG_LEVEL", "INFO").upper()  # DEBUG/INFO/WARNING/ERROR
    fmt = os.getenv("LOG_FMT", "%(asctime)s %(levelname)s [%(name)s] %(message)s")
    datefmt = "%Y-%m-%d %H:%M:%S"
    logging.basicConfig(level=level, format=fmt, datefmt=datefmt, force=True)

    # Exemple : réduire le bruit SQLAlchemy (optionnel)
    logging.getLogger("sqlalchemy.engine").setLevel(os.getenv("SQL_LOG_LEVEL", "WARNING").upper())
