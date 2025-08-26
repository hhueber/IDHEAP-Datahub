import asyncio


from backend.app import models
from backend.app.db import engine
from backend.app.models import Base
from backend.app.script.populate_db import populate_db


async def create_schema() -> None:
    async with engine.begin() as conn:
        # Drop toute les tables pour repartir de 0
        await conn.run_sync(Base.metadata.drop_all)
        # Cree les tables dans la base de données
        await conn.run_sync(Base.metadata.create_all)
    print("All Database schema created.")

    # Populate la base de donnée
    await populate_db()
    print("Database Populated with sucess")


if __name__ == "__main__":
    asyncio.run(create_schema())
