from typing import List


from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # DB components depuis .env
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int

    # Sécurité / API
    API_SECRET: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: str

    @field_validator("CORS_ORIGINS")
    @classmethod
    def _ensure_origins(cls, v: str) -> str:
        # stocke brut, on donnera la version list dans property ci-dessous
        return v

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
