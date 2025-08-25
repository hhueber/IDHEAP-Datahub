from app.core.config import API_SECRET, CORS_ORIGINS
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware


def setup_middlewares(app, secret_key: str = "change-me-in-prod"):
    app.add_middleware(SessionMiddleware, secret_key=secret_key)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
