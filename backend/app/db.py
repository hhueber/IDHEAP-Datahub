# engine + session async
from app.core.config import settings
from app.models import Base
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession, create_async_engine


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
