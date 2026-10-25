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

    def as_dict(self) -> dict[str, Any]:
        return self.__dict__


_SETTINGS: Settings | None = None


def get_settings() -> Settings:
    global _SETTINGS
    if _SETTINGS is None:
        # Load .env file so environment variables are available (from cwd)
        load_dotenv()
        _SETTINGS = Settings(
            app_name=os.getenv("APP_NAME", "KeelBill Ledger API"),
            environment=os.getenv("ENVIRONMENT", "development"),
            debug=os.getenv("DEBUG", "True").lower() in ("1", "true", "yes"),
            database_url=os.getenv("DATABASE_URL"),
            jwt_secret_key=os.getenv("JWT_SECRET_KEY", "changeme"),
            jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
            jwt_access_token_expires_minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "10080")),
            jwt_refresh_token_expires_days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30")),
            bcrypt_rounds=int(os.getenv("BCRYPT_ROUNDS", "12")),
        )
    return _SETTINGS
