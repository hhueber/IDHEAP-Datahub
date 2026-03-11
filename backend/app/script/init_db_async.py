import asyncio
import logging


from app import models
from app.core.config import settings
from app.core.logging_config import configure_logging
from app.db import AsyncSessionLocal, engine, ensure_extensions
from app.models import Base
from app.repositories.user_repo import any_admin_exists, create_user
from app.script.populate_config import populate_config_if_empty
from app.script.populate_db import populate_db
from app.script.populate_geo_db import populate_async_geo


logger = logging.getLogger(__name__)


async def create_schema() -> None:
    try:
        await ensure_extensions()
    except Exception as e:
        logger.warning("Could not ensure extensions (unaccent/postgis): %s", e)

    confirm = input("Do you want to drop the database and start from scratch? [y/N] > ")
    if confirm.lower() == "y":
        async with engine.begin() as conn:
            # Drop toute les tables pour repartir de 0
            logger.warning("Dropping all tables (destructive operation).")
            await conn.run_sync(Base.metadata.drop_all)
            await ensure_extensions()
            # Cree les tables dans la base de données
            logger.info("Creating all tables...")
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema created.")

    if settings.ROOT_EMAIL and settings.ROOT_PASSWORD:
        async with AsyncSessionLocal() as db:
            admin_exists = await any_admin_exists(db)
            if not admin_exists:
                admin = await create_user(
                    db,
                    settings.ROOT_EMAIL,
                    settings.ROOT_PASSWORD,
                    settings.ROOT_FIRST_NAME,
                    settings.ROOT_LAST_NAME,
                    role="ADMIN",
                )
                logger.info("Root admin created:")
            else:
                logger.info("Admin user(s) already exist; skipping root seed.")
    else:
        logger.info("ROOT_EMAIL or ROOT_PASSWORD not set; no root created.")

    # Config par défaut si besoin
    await populate_config_if_empty()
    logger.info("Config table initialized (if empty).")

    # Populate la base de donnée
    await populate_db()
    logger.info("Database populated successfully.")

    await populate_async_geo()
    logger.info("Database populated successfully with geo data.")


if __name__ == "__main__":
    configure_logging()
    asyncio.run(create_schema())
