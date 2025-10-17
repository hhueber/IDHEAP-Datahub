from app.core.middleware import setup_middlewares
from app.db import get_db
from app.router import home, questions
from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


app = FastAPI(title="IDHEAP Data Hub API")

setup_middlewares(app)

app.include_router(home.router, prefix="/home", tags=["home"])
app.include_router(questions.router, prefix="/questions", tags=["questions"])


# backend swagger: url:8000
@app.get("/")
async def root(db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("SELECT current_date"))
    current_date = res.scalar_one()
    return {"message": "Hello from FastAPI", "date": str(current_date)}
