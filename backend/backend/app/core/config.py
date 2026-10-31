from __future__ import annotations

import os
from dotenv import load_dotenv
from dataclasses import dataclass
from typing import Any


@dataclass
class Settings:
    app_name: str
    environment: str
    debug: bool

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str
    jwt_access_token_expires_minutes: int
    jwt_refresh_token_expires_days: int

    bcrypt_rounds: int
    frontend_url: str
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    smtp_from_email: str

    def as_dict(self) -> dict[str, Any]:
        return self.__dict__


_SETTINGS: Settings | None = None


def get_settings() -> Settings:
    global _SETTINGS
    if _SETTINGS is None:
        # Load .env file from the backend directory, overriding existing env vars
        from pathlib import Path
        env_path = Path(__file__).resolve().parent.parent.parent / ".env"
        load_dotenv(str(env_path), override=True)
        environment = os.getenv("ENVIRONMENT", "development")
        jwt_secret_key = os.getenv("JWT_SECRET_KEY", "changeme")
        if environment.lower() in {"production", "prod"} and (
            jwt_secret_key == "changeme" or len(jwt_secret_key.encode("utf-8")) < 32
        ):
            raise RuntimeError("Production requires a JWT_SECRET_KEY of at least 32 bytes")

        _SETTINGS = Settings(
            app_name=os.getenv("APP_NAME", "KeelBill Ledger API"),
            environment=environment,
            debug=os.getenv("DEBUG", "False").lower() in ("1", "true", "yes"),
            database_url=os.getenv("DATABASE_URL"),
            jwt_secret_key=jwt_secret_key,
            jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
            jwt_access_token_expires_minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "15")),
            jwt_refresh_token_expires_days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30")),
            bcrypt_rounds=int(os.getenv("BCRYPT_ROUNDS", "12")),
            frontend_url=os.getenv("FRONTEND_URL", "http://localhost:3002").rstrip("/"),
            smtp_host=os.getenv("SMTP_HOST", ""),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_username=os.getenv("SMTP_USERNAME", ""),
            smtp_password=os.getenv("SMTP_PASSWORD", ""),
            smtp_from_email=os.getenv("SMTP_FROM_EMAIL", ""),
        )
    return _SETTINGS


def reset_settings() -> None:
    """Reset cached settings (useful for reload during development)."""
    global _SETTINGS
    _SETTINGS = None
