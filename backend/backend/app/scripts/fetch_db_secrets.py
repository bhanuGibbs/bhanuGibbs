
"""
Fetch PostgreSQL credentials from AWS Secrets Manager
and write them to files for Docker PostgreSQL.
"""

import json
import logging
import os
import sys
import time
from pathlib import Path

import boto3
from botocore.exceptions import ClientError, BotoCoreError

logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "ap-south-2")
SECRET_ID = os.getenv("AWS_SECRET_ID", "prod/db")
OUTPUT_DIR = Path("/shared/secrets")


def fetch_secret(client, secret_id, max_retries=3, retry_delay=5):
    """Fetch JSON credentials from AWS Secrets Manager."""

    for attempt in range(1, max_retries + 1):
        try:
            response = client.get_secret_value(SecretId=secret_id)
            secret_string = response.get("SecretString")

            if not secret_string:
                raise RuntimeError("SecretString is empty or unavailable")

            credentials = json.loads(secret_string)

            if not isinstance(credentials, dict):
                raise RuntimeError("Secret must contain a JSON object")

            return credentials

        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code", "")

            if error_code in {
                "AccessDeniedException",
                "ResourceNotFoundException",
                "DecryptionFailure",
                "InvalidRequestException",
            }:
                raise RuntimeError(
                    f"AWS Secrets Manager request failed: {error_code}"
                ) from exc

            if attempt == max_retries:
                raise RuntimeError(
                    f"Failed to retrieve secret after {max_retries} attempts"
                ) from exc

            logger.warning(
                "Attempt %s/%s failed. Retrying in %s seconds.",
                attempt,
                max_retries,
                retry_delay,
            )
            time.sleep(retry_delay)

        except (BotoCoreError, json.JSONDecodeError) as exc:
            if attempt == max_retries:
                raise RuntimeError(
                    "Failed to retrieve or parse AWS secret"
                ) from exc

            logger.warning(
                "Attempt %s/%s failed. Retrying in %s seconds.",
                attempt,
                max_retries,
                retry_delay,
            )
            time.sleep(retry_delay)

    raise RuntimeError("Unable to retrieve database credentials")


def write_secret(filename, value):
    """Write a credential securely to a shared file."""

    if value is None or not str(value):
        raise RuntimeError(f"Required credential is empty: {filename}")

    file_path = OUTPUT_DIR / filename

    file_path.write_text(str(value), encoding="utf-8")
    file_path.chmod(0o444)

    logger.info("Successfully wrote %s", filename)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.chmod(0o700)

    logger.info("Connecting to AWS Secrets Manager")
    logger.info("AWS Region: %s", AWS_REGION)
    logger.info("Secret ID: %s", SECRET_ID)

    try:
        client = boto3.client(
            "secretsmanager",
            region_name=AWS_REGION,
        )

        credentials = fetch_secret(client, SECRET_ID)

        # Accept common JSON key naming conventions.
        username = (
                credentials.get("username")
                or credentials.get("POSTGRES_USER")
                or credentials.get("POSTGRES-USER")
        )

        password = (
                credentials.get("password")
                or credentials.get("POSTGRES_PASSWORD")
                or credentials.get("POSTGRES-PASSWORD")
        )

        dbname = (
                credentials.get("dbname")
                or credentials.get("database")
                or credentials.get("POSTGRES_DB")
                or credentials.get("POSTGRES-DB")
        )

        write_secret("user.txt", username)
        write_secret("password.txt", password)
        write_secret("dbname.txt", dbname)

        logger.info("All PostgreSQL credential files created successfully")

    except Exception as exc:
        logger.error("Database initialization failed: %s", exc)
        sys.exit(1)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
