from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent

STATIC_DIR = BASE_DIR / "static"
LOGO_UPLOAD_DIR = STATIC_DIR / "uploads" / "logos"
LOGO_PUBLIC_PREFIX = "/static/uploads/logos"
