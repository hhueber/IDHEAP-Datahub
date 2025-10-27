from typing import List, Literal


from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


SameSite = Literal["lax", "strict", "none"]


class Settings(BaseSettings):
    # Database
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    # Backend
    BACKEND_HOST: str
    BACKEND_PORT: int

    # Frontend
    FRONTEND_HOST: str
    FRONTEND_PORT: int

    # # Secrets
    API_SECRET: str
    SECRET_KEY: str

    # Security / API
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Cookie auth
    COOKIE_SECURE: bool = False  # True en prod (HTTPS)
    COOKIE_SAMESITE: SameSite = "lax"

    # CORS
    CORS_ORIGINS: str

    @field_validator("CORS_ORIGINS")
    @classmethod
    def _ensure_origins(cls, v: str) -> str:
        # On conserve la chaîne telle quelle (ex: "https://a.com, https://b.com").
        # La conversion en liste propre (["https://a.com", "https://b.com"])
        # est faite plus bas dans la propriété `CORS_ORIGINS_LIST`.
        return v

    # Super admin instance account
    ROOT_EMAIL: str | None = None
    ROOT_PASSWORD: str | None = None
    ROOT_NAME: str | None = "Admin Root"

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=False  # env_fill utile que en dev, case_sensitive passer a True en prod
    )

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
