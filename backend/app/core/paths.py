from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Racines
STATIC_FS_ROOT = BASE_DIR / "static"
STATIC_URL_ROOT = "/static"

# Logos
LOGO_SUBDIR = Path("uploads") / "logos"

# Dérivés
LOGO_UPLOAD_DIR = STATIC_FS_ROOT / LOGO_SUBDIR
LOGO_PUBLIC_PREFIX = f"{STATIC_URL_ROOT}/{LOGO_SUBDIR.as_posix()}"
