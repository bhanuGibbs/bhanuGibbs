from __future__ import annotations

import os
import logging
from dataclasses import dataclass
from typing import Any

from dotenv import dotenv_values, load_dotenv
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.core.exceptions import ClientAuthenticationError


logger = logging.getLogger(__name__)


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


    def as_dict(self) -> dict[str, Any]:
        return self.__dict__


_SETTINGS: Settings | None = None


def get_settings() -> Settings:
    global _SETTINGS
    if _SETTINGS is None:
        from pathlib import Path

        env_path = Path(__file__).resolve().parent.parent.parent / ".env"
        process_environment_keys = set(os.environ)
        dotenv_settings = dotenv_values(env_path)
        load_dotenv(str(env_path), override=False)
        environment = os.getenv("ENVIRONMENT", "development")
        is_production = environment.lower() in {"production", "prod"}
        jwt_secret_key = os.getenv("JWT_SECRET_KEY", "changeme")

        key_vault_url = os.environ.get("KEY_VAULT_URL")
        secret_sources = {}  # tracks where each secret came from
        use_key_vault = False

        if is_production and key_vault_url:
            try:
                logger.info("Attempting to load secrets from Azure Key Vault: %s", key_vault_url)
                credential = DefaultAzureCredential()
                # Force credential resolution early to catch auth failures
                credential.get_token("https://vault.azure.net/.default")
                client = SecretClient(vault_url=key_vault_url, credential=credential)

                def get_secret(name: str) -> str:
                    value = client.get_secret(name).value
                    if not value:
                        raise RuntimeError(f"Required Key Vault secret is empty: {name}")
                    secret_sources[name] = "Azure Key Vault"
                    return value

                database_url = get_secret("DATABASE-URL")
                jwt_secret_key = get_secret("JWT-SECRET-KEY")
                smtp_username = get_secret("SMTP-USERNAME")
                smtp_password = get_secret("SMTP-PASSWORD")
                smtp_from_email = get_secret("SMTP-FROM-EMAIL")
                smtp_to_email = get_secret("SMTP-TO-EMAIL")
                use_key_vault = True
                logger.info("Successfully loaded all secrets from Azure Key Vault")
            except ClientAuthenticationError as e:
                logger.warning(
                    "Azure Key Vault authentication failed: %s. Falling back to environment variables.",
                    e.message,
                )
                use_key_vault = False
            except Exception as e:
                logger.warning(
                    "Azure Key Vault error: %s. Falling back to environment variables.",
                    str(e),
                )
                use_key_vault = False

        if not use_key_vault:
            def local_source(key: str) -> str:
                if key in process_environment_keys:
                    return "process environment"
                if key in dotenv_settings:
                    return ".env file"
                return "not set"

            database_url = os.getenv("DATABASE_URL")
            secret_sources["DATABASE_URL"] = local_source("DATABASE_URL")

            jwt_source = local_source("JWT_SECRET_KEY")
            secret_sources["JWT_SECRET_KEY"] = jwt_source

            smtp_username = os.getenv("SMTP_USERNAME", "")
            secret_sources["SMTP_USERNAME"] = local_source("SMTP_USERNAME")

            smtp_password = os.getenv("SMTP_PASSWORD", "")
            secret_sources["SMTP_PASSWORD"] = local_source("SMTP_PASSWORD")

            smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "")
            secret_sources["SMTP_FROM_EMAIL"] = local_source("SMTP_FROM_EMAIL")

            smtp_to_email = os.getenv("SMTP_TO_EMAIL", "")
            secret_sources["SMTP_TO_EMAIL"] = local_source("SMTP_TO_EMAIL")

        if not database_url:
            raise RuntimeError("Database URL is missing or empty")

        if is_production and (
            jwt_secret_key == "changeme" or len(jwt_secret_key.encode("utf-8")) < 32
        ):
            raise RuntimeError("Production requires a JWT_SECRET_KEY of at least 32 bytes")

        # Log the source of each secret for debugging
        for secret_name, source in secret_sources.items():
            logger.info("Secret %s → loaded from %s", secret_name, source)

        _SETTINGS = Settings(
            app_name=os.getenv("APP_NAME", "KeelBill Ledger API"),
            environment=environment,
            debug=os.getenv("DEBUG", "False").lower() in ("1", "true", "yes"),
            database_url=database_url,
            jwt_secret_key=jwt_secret_key,
            jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
            jwt_access_token_expires_minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "15")),
            jwt_refresh_token_expires_days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30")),
            bcrypt_rounds=int(os.getenv("BCRYPT_ROUNDS", "12")),
            frontend_url=os.getenv("FRONTEND_URL", "http://localhost:3002").rstrip("/"),
            smtp_host=os.getenv("SMTP_HOST", ""),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_username=smtp_username,
            smtp_password=smtp_password,
            smtp_from_email=smtp_from_email,
            smtp_to_email=smtp_to_email,
        )
    return _SETTINGS


def reset_settings() -> None:
    """Reset cached settings (useful for reload during development)."""
    global _SETTINGS
    _SETTINGS = None
