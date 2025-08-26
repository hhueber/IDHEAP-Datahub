import asyncio


from backend.app import models
from backend.app.db import engine
from backend.app.models import Base
from backend.app.script.populate_db import populate_db


async def create_schema() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("All Database schema created.")

    await populate_db()


if __name__ == "__main__":
    asyncio.run(create_schema())
