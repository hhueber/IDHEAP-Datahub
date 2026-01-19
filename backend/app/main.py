from pathlib import Path


from app.api.router import auth, communes, config, delete, geo, home, pageAll, pageShow, questions, user
from app.core.middleware import setup_middlewares
from app.core.paths import STATIC_DIR
from app.db import get_db
from fastapi import Depends, FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


print("lol")
app = FastAPI(title="IDHEAP Data Hub API")

setup_middlewares(app)

app.include_router(home.router, prefix="/home", tags=["home"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(questions.router, prefix="/questions", tags=["questions"])
app.include_router(geo.router, prefix="/geo", tags=["geo"])
app.include_router(config.router, prefix="/config", tags=["config"])
app.include_router(communes.router, prefix="/communes", tags=["communes"])
app.include_router(pageAll.router, prefix="/pageAll", tags=["pageAll"])
app.include_router(delete.router, prefix="/delete", tags=["delete"])
app.include_router(pageShow.router, prefix="/show", tags=["pageShow"])

Path(STATIC_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# backend swagger: url:8000
@app.get("/")
async def root(db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("SELECT current_date"))
    current_date = res.scalar_one()
    return {"message": "Hello from FastAPI", "date": str(current_date)}
