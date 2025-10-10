# test d'exemple a deleate dans le future
from app.db import get_db, ping_db
from fastapi import APIRouter, Depends, HTTPException, Query
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


@router.get("/db/table/{table_name}")
async def read_table(
    table_name: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Quick tools that are used to simply view the data in each table using SQL.
    Returns the paged contents of a PostgreSQL table from the `public` schema.

    Args:
        table_name (str): Name of the table (must exist in the `public` schema).
        limit (int): Maximum number of rows to return (1–500). Default is 50.
        offset (int): Pagination offset (>= 0). Default is 0.
        db (AsyncSession): Asynchronous SQLAlchemy session injected by FastAPI.

    Returns:
        dict: {
            "table": str,          # table name
            "total": int,          # total number of rows in the table
            "limit": int,          # requested limit
            "offset": int,         # requested offset
            "columns": List[str],  # column names (empty if no rows)
            "rows": List[dict]     # rows in dict format (key = column name)
        }

    """
    # Whitelist: we validate that the table exists in 'public'
    res = await db.execute(
        text(
            """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema='public' AND table_type='BASE TABLE'
    """
        )
    )
    allowed = set(res.scalars().all())
    if table_name not in allowed:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

    data_res = await db.execute(
        text(f'SELECT * FROM "{table_name}" ORDER BY 1 LIMIT :limit OFFSET :offset'),
        {"limit": limit, "offset": offset},
    )
    rows = [dict(r._mapping) for r in data_res]

    total = (await db.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))).scalar_one()

    columns = list(rows[0].keys()) if rows else []

    return {
        "table": table_name,
        "total": total,
        "limit": limit,
        "offset": offset,
        "columns": columns,
        "rows": rows,
    }
