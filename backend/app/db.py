# engine + session async
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

SessionLocal = AsyncSessionLocal


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def ping_db():
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))


async def ensure_extensions():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS unaccent;"))
