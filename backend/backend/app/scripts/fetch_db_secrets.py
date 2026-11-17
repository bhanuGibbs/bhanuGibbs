
"""
Fetch application credentials from AWS Secrets Manager
and write them to shared files for Docker containers.
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
                raise RuntimeError("SecretString is empty")

            credentials = json.loads(secret_string)

            if not isinstance(credentials, dict):
                raise RuntimeError("Secret must be a JSON object")

            return credentials

        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")

            if code in {
                "AccessDeniedException",
                "ResourceNotFoundException",
                "DecryptionFailure",
                "InvalidRequestException",
            }:
                raise RuntimeError(
                    f"AWS Secrets Manager request failed: {code}"
                ) from exc

            if attempt == max_retries:
                raise RuntimeError(
                    "Failed to retrieve AWS secret"
                ) from exc

            logger.warning(
                "AWS request failed. Attempt %s/%s; retrying.",
                attempt, max_retries
            )
            time.sleep(retry_delay)

        except (BotoCoreError, json.JSONDecodeError) as exc:
            if attempt == max_retries:
                raise RuntimeError(
                    "Failed to retrieve or parse AWS secret"
                ) from exc

            logger.warning(
                "Secret retrieval failed. Attempt %s/%s; retrying.",
                attempt, max_retries
            )
            time.sleep(retry_delay)

    raise RuntimeError("Unable to retrieve AWS credentials")


def write_secret(filename, value):
    """Write a secret to a read-only shared file."""

    if value is None or not str(value).strip():
        raise RuntimeError(
            f"Required AWS secret is missing: {filename}"
        )

    file_path = OUTPUT_DIR / filename

    file_path.write_text(str(value), encoding="utf-8")
    file_path.chmod(0o444)

    logger.info("Created secret file: %s", filename)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.chmod(0o755)

    try:
        logger.info("Connecting to AWS Secrets Manager")
        logger.info("AWS Region: %s", AWS_REGION)
        logger.info("Secret ID: %s", SECRET_ID)

        client = boto3.client(
            "secretsmanager",
            region_name=AWS_REGION,
        )

        credentials = fetch_secret(client, SECRET_ID)

        # AWS JSON key -> shared secret filename
        secret_files = {
            "user.txt": "POSTGRES-USER",
            "password.txt": "POSTGRES-PASSWORD",
            "dbname.txt": "POSTGRES-DB",
            "database_url_docker.txt": "DATABASE-URL-DOCKER",
            "database_url.txt": "DATABASE-URL",
            "jwt_secret_key.txt": "JWT-SECRET-KEY",
            "smtp_username.txt": "SMTP-USERNAME",
            "smtp_password.txt": "SMTP-PASSWORD",
            "smtp_from_email.txt": "SMTP-FROM-EMAIL",
            "smtp_to_email.txt": "SMTP-TO-EMAIL",
        }

        # Validate every required value before writing any files.
        for filename, key in secret_files.items():
            value = credentials.get(key)

            if value is None or not str(value).strip():
                raise RuntimeError(
                    f"Required AWS JSON key is missing: {key}"
                )

        # Write all validated secrets.
        for filename, key in secret_files.items():
            write_secret(filename, credentials[key])

        logger.info(
            "Successfully created all %s secret files",
            len(secret_files),
        )

    except Exception as exc:
        logger.error("Secret initialization failed: %s", exc)
        sys.exit(1)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
