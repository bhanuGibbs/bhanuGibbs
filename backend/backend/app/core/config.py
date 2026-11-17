
from __future__ import annotations

import os
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

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
    """Read a secret file created by the AWS db-init container."""

    file_path = SECRET_DIR / filename

    if not file_path.is_file():
        raise RuntimeError(
            f"Required AWS secret file is missing: {filename}"
        )

    value = file_path.read_text(encoding="utf-8").strip()

    if not value:
        raise RuntimeError(
            f"AWS secret file is empty: {filename}"
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

        # ------------------------------------------
        # LOCAL DEVELOPMENT: Load .env
        # ------------------------------------------

        if not is_production:
            if env_path.exists():
                load_dotenv(str(env_path), override=False)

            environment = os.getenv("ENVIRONMENT", "development")
            print(
                "CONFIG: Development mode - using environment/.env",
                flush=True,
            )

        # ------------------------------------------
        # PRODUCTION: Load secrets from AWS files
        # ------------------------------------------

        if is_production:
            print(
                "CONFIG: Production mode - reading AWS secret files",
                flush=True,
            )

            database_url = read_secret_file(
                "database_url_docker.txt"
            )

            postgres_password = read_secret_file(
                "password.txt"
            )

            jwt_secret_key = read_secret_file(
                "jwt_secret_key.txt"
            )

            smtp_username = read_secret_file(
                "smtp_username.txt"
            )

            smtp_password = read_secret_file(
                "smtp_password.txt"
            )

            smtp_from_email = read_secret_file(
                "smtp_from_email.txt"
            )

            smtp_to_email = read_secret_file(
                "smtp_to_email.txt"
            )

            print(
                "CONFIG: Database, JWT and SMTP secrets loaded from AWS files",
                flush=True,
            )

        # ------------------------------------------
        # LOCAL DEVELOPMENT: Read environment values
        # ------------------------------------------

        else:
            database_url = os.getenv("DATABASE_URL", "")

            postgres_password = os.getenv(
                "POSTGRES_PASSWORD", ""
            )

            jwt_secret_key = os.getenv(
                "JWT_SECRET_KEY", "changeme"
            )

            smtp_username = os.getenv(
                "SMTP_USERNAME", ""
            )

            smtp_password = os.getenv(
                "SMTP_PASSWORD", ""
            )

            smtp_from_email = os.getenv(
                "SMTP_FROM_EMAIL", ""
            )

            smtp_to_email = os.getenv(
                "SMTP_TO_EMAIL", ""
            )

        # ------------------------------------------
        # Validate required settings
        # ------------------------------------------

        if not database_url:
            raise RuntimeError(
                "Database URL is missing"
            )

        if is_production:
            if (
                    jwt_secret_key == "changeme"
                    or len(jwt_secret_key.encode("utf-8")) < 32
            ):
                raise RuntimeError(
                    "Production requires a JWT_SECRET_KEY "
                    "of at least 32 bytes"
                )

        # ------------------------------------------
        # Initialize application settings
        # ------------------------------------------

        _SETTINGS = Settings(
            app_name=os.getenv(
                "APP_NAME",
                "KeelBill Ledger API",
            ),

            environment=environment,

            debug=os.getenv(
                "DEBUG", "False"
            ).lower() in ("1", "true", "yes"),

            database_url=database_url,

            jwt_secret_key=jwt_secret_key,

            jwt_algorithm=os.getenv(
                "JWT_ALGORITHM", "HS256"
            ),

            jwt_access_token_expires_minutes=int(
                os.getenv(
                    "JWT_ACCESS_TOKEN_EXPIRES_MINUTES",
                    "15",
                )
            ),

            jwt_refresh_token_expires_days=int(
                os.getenv(
                    "JWT_REFRESH_TOKEN_EXPIRES_DAYS",
                    "30",
                )
            ),

            bcrypt_rounds=int(
                os.getenv("BCRYPT_ROUNDS", "12")
            ),

            frontend_url=os.getenv(
                "FRONTEND_URL",
                "http://localhost:3002",
            ).rstrip("/"),

            smtp_host=os.getenv(
                "SMTP_HOST", ""
            ),

            smtp_port=int(
                os.getenv("SMTP_PORT", "587")
            ),

            smtp_username=smtp_username,
            smtp_password=smtp_password,
            smtp_from_email=smtp_from_email,
            smtp_to_email=smtp_to_email,

            postgres_password=postgres_password,
        )

        logger.info(
            "Application settings initialized for %s",
            environment,
        )

    return _SETTINGS


def reset_settings() -> None:
    """Reset cached settings (useful during development)."""

    global _SETTINGS
    _SETTINGS = None
