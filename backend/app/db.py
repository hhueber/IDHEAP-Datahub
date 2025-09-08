# engine + session async
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession, create_async_engine


from backend.app.core.config import DATABASE_URL


engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True, plugins=["geoalchemy2"])

SessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False,
)
