from app.core.middleware import setup_middlewares
from app.db import get_db
from fastapi import Depends, FastAPI
from sqlalchemy.ext.asyncio import AsyncSession


app = FastAPI(title="IDHEAP Data Hub API")

setup_middlewares(app)


# backend swagger: url:8000
@app.get("/")
async def root(db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("SELECT current_date"))
    current_date = res.scalar_one()
    return {"message": "Hello from FastAPI", "date": str(current_date)}
