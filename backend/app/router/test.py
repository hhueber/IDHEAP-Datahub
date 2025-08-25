# test d'exemple a deleate dans le future
from app.db import get_db, ping_db
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


# api test: url/docs
@router.get("/health")
async def health():
    return {"status": "ok"}


# db test: url/docs
@router.get("/db-check")
async def db_check():
    await ping_db()
    return {"db": "ok"}


# db tables test: url/docs
@router.get("/db/tables")
async def list_tables(db: AsyncSession = Depends(get_db)):
    q = text(
        """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """
    )
    rows = (await db.execute(q)).scalars().all()
    return {"tables": rows}
