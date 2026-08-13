"""Core Configuration Module.

Manages application settings and database connection defaults using Pydantic Settings.
"""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application Settings Schema."""

    PROJECT_NAME: str = "AWS Route 53 Clone"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # SQLite Database URL
    DATABASE_URL: str = "sqlite:///./route53.db"

    # Secret key for JWT auth / session signing
    SECRET_KEY: str = "super-secret-key-change-in-production-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
