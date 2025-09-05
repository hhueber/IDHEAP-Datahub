import asyncio


from sqlalchemy.ext.asyncio import AsyncSession


from backend.app.db import engine


async def init_async_geo() -> None:
    pass


if __name__ == "__main__":
    asyncio.run(init_async_geo())
