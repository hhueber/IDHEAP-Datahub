import asyncio


from app import models
from app.db import engine
from app.models import Base


async def create_schema() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("All Database schema created.")


if __name__ == "__main__":
    asyncio.run(create_schema())
