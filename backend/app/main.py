from app.api.router import auth, config, delete, edit, export, geo, home, questions, user
from app.core.middleware import setup_middlewares
from app.core.paths import STATIC_FS_ROOT, STATIC_URL_ROOT
from app.db import get_db
from fastapi import Depends, FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


from backend.app.api.router import geo_search, page_all, page_show


app = FastAPI(title="IDHEAP Data Hub API")

setup_middlewares(app)

app.include_router(home.router, prefix="/home", tags=["home"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(questions.router, prefix="/questions", tags=["questions"])
app.include_router(geo.router, prefix="/geo", tags=["geo"])
app.include_router(config.router, prefix="/config", tags=["config"])
app.include_router(geo_search.router, prefix="/geoSearch", tags=["geoSearch"])
app.include_router(page_all.router, prefix="/pageAll", tags=["pageAll"])
app.include_router(delete.router, prefix="/delete", tags=["delete"])
app.include_router(page_show.router, prefix="/show", tags=["pageShow"])
app.include_router(edit.router, prefix="/edit", tags=["edit"])
app.include_router(export.router, prefix="/export", tags=["export"])


STATIC_FS_ROOT.mkdir(parents=True, exist_ok=True)
app.mount(
    STATIC_URL_ROOT,
    StaticFiles(directory=str(STATIC_FS_ROOT)),
    name="static",
)


# backend swagger: url:8000
@app.get("/")
async def root(db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("SELECT current_date"))
    current_date = res.scalar_one()
    return {"message": "Hello from FastAPI", "date": str(current_date)}
