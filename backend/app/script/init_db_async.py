import asyncio


from backend.app import models
from backend.app.db import engine
from backend.app.models import Base


async def create_schema() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("All Database schema created.")


if __name__ == "__main__":
    asyncio.run(create_schema())
