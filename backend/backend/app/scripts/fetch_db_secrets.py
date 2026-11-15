"""Fetch database credentials from Azure Key Vault and write them to files for PostgreSQL."""

import os
import sys
import time
from pathlib import Path

from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.core.exceptions import ClientAuthenticationError, ResourceNotFoundError


def fetch_secret(client: SecretClient, name: str, max_retries: int = 3, retry_delay: int = 5) -> str:
    """Fetch a secret from Key Vault with retry logic."""
    for attempt in range(1, max_retries + 1):
        try:
            value = client.get_secret(name).value
            if not value:
                raise RuntimeError(f"Secret '{name}' is empty")
            return value
        except (ClientAuthenticationError, ResourceNotFoundError) as e:
            raise e  # Don't retry auth failures
        except Exception as e:
            if attempt == max_retries:
                print(f"ERROR: Failed to fetch secret '{name}' after {max_retries} attempts: {e}", flush=True)
                sys.exit(1)
            print(f"WARNING: Attempt {attempt}/{max_retries} failed for '{name}': {e}. Retrying in {retry_delay}s...", flush=True)
            time.sleep(retry_delay)


def main():
    vault_url = os.environ.get("KEY_VAULT_URL")
    if not vault_url:
        print("ERROR: KEY_VAULT_URL environment variable is not set", flush=True)
        sys.exit(1)

    output_dir = Path("/shared/secrets")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_dir.chmod(0o777)  # Ensure the Python process can write to the mounted volume

    print(f"Connecting to Azure Key Vault: {vault_url}", flush=True)
    try:
        credential = DefaultAzureCredential()
        credential.get_token("https://vault.azure.net/.default")
        client = SecretClient(vault_url=vault_url, credential=credential)
    except Exception as e:
        print(f"ERROR: Failed to authenticate with Azure Key Vault: {e}", flush=True)
        sys.exit(1)

    # Define secrets to fetch and their output files
    secrets = {
        "POSTGRES-PASSWORD": output_dir / "password.txt",
        "POSTGRES-USER": output_dir / "user.txt",
        "POSTGRES-DB": output_dir / "dbname.txt",
    }

    for secret_name, file_path in secrets.items():
        try:
            value = fetch_secret(client, secret_name)
            file_path.write_text(value)
            file_path.chmod(0o644)  # Ensure readable by PostgreSQL
            print(f"✓ Wrote {secret_name} → {file_path}", flush=True)
        except Exception as e:
            print(f"ERROR: Failed to write {secret_name}: {e}", flush=True)
            sys.exit(1)

    print("All database credentials written successfully", flush=True)


if __name__ == "__main__":
    main()
