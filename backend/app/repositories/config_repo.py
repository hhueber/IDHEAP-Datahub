from pathlib import Path
from typing import Dict, Optional


from app.core.paths import LOGO_PUBLIC_PREFIX, LOGO_UPLOAD_DIR
from app.models.config import Config
from app.schemas.theme_config import ThemeConfig
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession


async def list_config(db: AsyncSession) -> Dict[str, str]:
    """Retourne toutes les paires key/value de la table config."""
    result = await db.execute(select(Config))
    rows = result.scalars().all()
    return {row.key: row.value for row in rows}


async def upsert_config_value(
    db: AsyncSession,
    key: str,
    value: str,
    description: Optional[str] = None,
) -> None:
    """Insère ou met à jour une clé de config."""
    existing = await db.get(Config, key)
    if existing:
        existing.value = value
        if description is not None:
            existing.description = description
    else:
        db.add(Config(key=key, value=value, description=description))


async def delete_config_key(db: AsyncSession, key: str) -> None:
    """Supprime une clé de config (pour gérer les valeurs nulles si besoin)."""
    await db.execute(delete(Config).where(Config.key == key))


def _delete_logo_file_if_exists(url: str | None) -> None:
    """
    Supprime physiquement le fichier du logo si l'URL pointe
    dans LOGO_PUBLIC_PREFIX.
    """
    if not url:
        return
    if not url.startswith(LOGO_PUBLIC_PREFIX):
        return

    # Exemple:
    #   url = "/static/uploads/logos/instance_slug/logo_xxx.png"
    #   LOGO_PUBLIC_PREFIX = "/static/uploads/logos"
    rel = url[len(LOGO_PUBLIC_PREFIX) :].lstrip("/")  # "instance_slug/logo_xxx.png"
    file_path: Path = LOGO_UPLOAD_DIR / rel

    try:
        if file_path.is_file():
            file_path.unlink()
    except Exception:
        # On évite de faire échouer toute la requête juste pour un unlink
        pass


async def get_theme_config(db: AsyncSession) -> ThemeConfig:
    """
    Construit un ThemeConfig à partir des entrées de la table config.
    On ne garde que les clés connues par le schéma ThemeConfig.
    """
    all_conf = await list_config(db)
    allowed_keys = set(ThemeConfig.model_fields.keys())
    payload: Dict[str, str] = {}

    for k, v in all_conf.items():
        if k in allowed_keys:
            payload[k] = v

    return ThemeConfig(**payload)


async def upsert_theme_config(db: AsyncSession, cfg: ThemeConfig) -> None:
    """
    Met à jour la config à partir d'un ThemeConfig.
    - Les champs NON envoyés ne sont PAS modifiés
    - Les champs envoyés avec None -> suppriment la clé (et suppriment
      le fichier si c'est logo_url)
    - Les autres -> upsert (clé / valeur)
    """
    data = cfg.model_dump(exclude_unset=True)

    # On récupère la config actuelle pour connaître l'ancien logo
    all_conf = await list_config(db)
    old_logo_url = all_conf.get("logo_url")

    for key, value in data.items():
        if key == "logo_url":
            # Gestion spécifique du logo
            if value is None:
                # On supprime la clé et le fichier si il existe
                if old_logo_url:
                    _delete_logo_file_if_exists(old_logo_url)
                await delete_config_key(db, key)
            else:
                new_url = str(value)
                # Si on change d'URL, on supprime l'ancien fichier
                if old_logo_url and old_logo_url != new_url:
                    _delete_logo_file_if_exists(old_logo_url)
                await upsert_config_value(
                    db,
                    key="logo_url",
                    value=new_url,
                    description="URL du logo de l'instance",
                )
        else:
            # Comportement standard pour toutes les autres clés
            if value is None:
                await delete_config_key(db, key)
            else:
                await upsert_config_value(db, key, str(value))
