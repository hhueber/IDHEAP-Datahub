from uuid import uuid4
import base64
import re


from app.core.paths import LOGO_PUBLIC_PREFIX, LOGO_UPLOAD_DIR
from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def load_effective_config(session: AsyncSession) -> dict[str, str]:
    """Retourne la config key/value à partir de la table config."""
    result = await session.execute(text("SELECT key, value FROM config"))
    rows = result.mappings().all()
    return {row["key"]: row["value"] for row in rows}


async def handle_logo_data_url(db: AsyncSession, data_url: str) -> str:
    """
    - Valide le data URL (image)
    - Décode le base64
    - Détermine le dossier d'upload en fonction du LOGO_PUBLIC_PREFIX
    - Sauvegarde le nouveau fichier sur disque
    - Retourne l'URL publique à stocker dans la config (LOGO_PUBLIC_PREFIX/filename)
    """
    if not data_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing image data",
        )

    data_url = data_url.strip()
    if not data_url.startswith("data:image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image data URL",
        )

    # Split header / payload base64
    try:
        header, b64 = data_url.split(",", 1)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid data URL format",
        )

    # Exemple de header: "data:image/png;base64"
    try:
        mime = header.split(";")[0].split(":", 1)[1]  # "image/png"
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid data URL header",
        )

    if mime not in {"image/png", "image/jpeg", "image/webp", "image/gif"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type",
        )

    ext_map = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    ext = ext_map.get(mime, ".png")

    try:
        raw = base64.b64decode(b64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not decode base64 image",
        )

    # Taille max (ex: 512 Ko)
    max_size = 512 * 1024
    if len(raw) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image too large",
        )

    # Dossier: static/uploads/logos/<instance_slug>/
    upload_dir = LOGO_UPLOAD_DIR
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Sauvegarder le nouveau fichier
    filename = f"logo_{uuid4().hex}{ext}"
    dest_path = upload_dir / filename
    dest_path.write_bytes(raw)

    # URL publique renvoyée au front
    public_url = f"{LOGO_PUBLIC_PREFIX}/{filename}"
    return public_url
