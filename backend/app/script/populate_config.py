from pathlib import Path
import json
import logging


from app.db import AsyncSessionLocal
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


logger = logging.getLogger(__name__)

CONFIG_SEED_PATH = Path(__file__).with_name("config_defaults.json")


def sanitize_key(raw: object) -> str | None:
    key = str(raw).strip()
    if not key:
        return None
    if len(key) > 100:
        return None
    return key


def sanitize_value(raw: object) -> str | None:
    value = str(raw).strip()
    if not value:
        return None
    if len(value) > 1000:
        return None
    return value


async def populate_config_if_empty() -> None:
    """Insère la config par défaut uniquement si la table est vide."""
    async with AsyncSessionLocal() as session:  # type: AsyncSession
        # Vérifier si la table existe et si elle contient déjà des lignes
        try:
            result = await session.execute(text("SELECT COUNT(*) FROM config"))
            count = result.scalar_one()
        except Exception as e:
            logger.error("Unable to check config table: %s", e)
            return

        if count and count > 0:
            logger.info("config already has %s rows; skipping config seed.", count)
            return

        # Charger le JSON
        try:
            with CONFIG_SEED_PATH.open("r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            logger.error("Failed to load config_defaults.json: %s", e)
            return

        for raw_key, raw_value in data.items():
            key = sanitize_key(raw_key)
            value = sanitize_value(raw_value)

            if key is None or value is None:
                logger.warning("Skipping invalid config entry: key=%r value=%r", raw_key, raw_value)
                continue

            # mini-check des valeurs et clés spécifiques
            if key == "theme_default_mode" and value not in {"light", "dark"}:
                logger.warning("Skipping invalid theme_default_mode: %r", value)
                continue

            await session.execute(
                text(
                    """
                    INSERT INTO config (key, value)
                    VALUES (:key, :value)
                    ON CONFLICT (key) DO NOTHING
                    """
                ),
                {"key": key, "value": value},
            )

        await session.commit()
        logger.info("Default config inserted into app_config.")
