import asyncio
import logging


from backend.app import models
from backend.app.core.logging_config import configure_logging
from backend.app.db import engine
from backend.app.models import Base
from backend.app.script.populate_db import populate_db


logger = logging.getLogger(__name__)


async def create_schema() -> None:
    async with engine.begin() as conn:
        # Drop toute les tables pour repartir de 0
        logger.warning("Dropping all tables (destructive operation).")
        await conn.run_sync(Base.metadata.drop_all)
        # Cree les tables dans la base de données
        logger.info("Creating all tables…")
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema created.")

    # Populate la base de donnée
    await populate_db()
    logger.info("Database populated successfully.")


if __name__ == "__main__":
    configure_logging()
    asyncio.run(create_schema())
