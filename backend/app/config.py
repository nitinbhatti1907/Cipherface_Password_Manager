from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    APP_NAME: str = "CipherFace API"
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./cipherface.db"
    JWT_SECRET: str = "change_me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30
    VAULT_ENCRYPTION_KEY: str = "change_me_to_a_long_random_secret"
    CORS_ORIGINS: str = "http://localhost:5173"
    FACE_MODE: str = "descriptor"
    FACE_MATCH_THRESHOLD: float = 0.36
    FACE_AVERAGE_THRESHOLD: float = 0.40
    FACE_SIDE_MIN_DISTANCE: float = 0.05
    LOGIN_MAX_ATTEMPTS: int = 5
    FACE_RESET_AFTER_ATTEMPTS: int = 3
    LOCKOUT_MINUTES: int = 15

    @field_validator("FACE_MODE")
    @classmethod
    def validate_face_mode(cls, value: str) -> str:
        allowed = {"descriptor", "image"}
        if value not in allowed:
            raise ValueError(f"FACE_MODE must be one of {allowed}")
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        return [item.strip() for item in self.CORS_ORIGINS.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()