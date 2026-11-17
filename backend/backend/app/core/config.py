
from __future__ import annotations

import os
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

from dotenv import dotenv_values, load_dotenv

logger = logging.getLogger(__name__)

SECRET_DIR = Path("/shared/secrets")


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
    smtp_to_email: str
    postgres_password: str

    def as_dict(self) -> dict[str, Any]:
        return self.__dict__


_SETTINGS: Settings | None = None


def read_secret_file(filename: str) -> str:
    """Read a database credential written by db-init."""

    file_path = SECRET_DIR / filename

    if not file_path.is_file():
        raise RuntimeError(
            f"Required AWS secret file is missing: {file_path}"
        )

    value = file_path.read_text(encoding="utf-8").strip()

    if not value:
        raise RuntimeError(
            f"AWS secret file is empty: {file_path}"
        )

    return value


def get_settings() -> Settings:
    global _SETTINGS

    if _SETTINGS is None:

        env_path = (
                Path(__file__).resolve().parent.parent.parent / ".env"
        )

        environment = os.getenv("ENVIRONMENT", "development")
        is_production = environment.lower() in {"production", "prod"}

        # Development: load local .env
        if not is_production and env_path.exists():
            load_dotenv(str(env_path), override=False)
            print("CONFIG: Development .env loaded", flush=True)

        # Production: read DB credentials from AWS db-init files
        if is_production:
            print(
                "CONFIG: Production mode - reading AWS credentials",
                flush=True
            )

            postgres_password = read_secret_file("password.txt")
            postgres_user = read_secret_file("user.txt")
            postgres_db = read_secret_file("dbname.txt")

            db_host = os.getenv("DB_HOST", "db")
            db_port = os.getenv("DB_PORT", "5432")

            database_url = (
                f"postgresql://{quote_plus(postgres_user)}:"
                f"{quote_plus(postgres_password)}@"
                f"{db_host}:{db_port}/{quote_plus(postgres_db)}"
            )

            print(
                "CONFIG: Database credentials loaded from AWS secret files",
                flush=True
            )

        else:
            # Development: use local database configuration
            database_url = os.getenv("DATABASE_URL", "")
            postgres_password = os.getenv("POSTGRES_PASSWORD", "")

            if not database_url:
                raise RuntimeError(
                    "DATABASE_URL is missing in development mode"
                )

        jwt_secret_key = os.getenv("JWT_SECRET_KEY", "changeme")

        if is_production:
            if (
                    jwt_secret_key == "changeme"
                    or len(jwt_secret_key.encode("utf-8")) < 32
            ):
                raise RuntimeError(
                    "Production requires a JWT_SECRET_KEY of at least 32 bytes"
                )

        if not database_url:
            raise RuntimeError("Database URL is missing")

        _SETTINGS = Settings(
            app_name=os.getenv(
                "APP_NAME", "KeelBill Ledger API"
            ),
            environment=environment,
            debug=os.getenv(
                "DEBUG", "False"
            ).lower() in ("1", "true", "yes"),

            database_url=database_url,

            jwt_secret_key=jwt_secret_key,
            jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
            jwt_access_token_expires_minutes=int(
                os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "15")
            ),
            jwt_refresh_token_expires_days=int(
                os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30")
            ),

            bcrypt_rounds=int(os.getenv("BCRYPT_ROUNDS", "12")),
            frontend_url=os.getenv(
                "FRONTEND_URL", "http://localhost:3002"
            ).rstrip("/"),

            smtp_host=os.getenv("SMTP_HOST", ""),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_username=os.getenv("SMTP_USERNAME", ""),
            smtp_password=os.getenv("SMTP_PASSWORD", ""),
            smtp_from_email=os.getenv("SMTP_FROM_EMAIL", ""),
            smtp_to_email=os.getenv("SMTP_TO_EMAIL", ""),

            postgres_password=postgres_password,
        )

        logger.info(
            "Application settings initialized for %s",
            environment
        )

    return _SETTINGS


def reset_settings() -> None:
    """Reset cached settings."""

    global _SETTINGS
    _SETTINGS = None
