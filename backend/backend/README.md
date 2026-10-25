# Quotation Generator Backend

## Requirements
- Python 3.12+
- Docker and Docker Compose
- PostgreSQL (for local or Docker-based deployments)

## Setup

1. Copy `.env.example` to `.env`.
2. Update database URL and JWT secret values.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running Locally

```bash
uvicorn app.main:app --reload
```

## Docker Compose

Copy the sample Compose settings to `.env` and replace the placeholder
passwords/secrets. The database hostname in `DATABASE_URL` must be `db`, and
special characters in the password must be URL-encoded.

PowerShell, from the repository root:

```powershell
Copy-Item backend\docker\.env.example backend\docker\.env
docker compose --env-file backend\docker\.env -f backend\docker\docker-compose.yml up --build
```

Unix-like shells, from the repository root:

```bash
cp backend/docker/.env.example backend/docker/.env
docker compose --env-file backend/docker/.env -f backend/docker/docker-compose.yml up --build
```

To stop the services while preserving PostgreSQL data:

```bash
docker compose --env-file backend/docker/.env -f backend/docker/docker-compose.yml down
```

PostgreSQL data is stored in a named volume. Do not use `down --volumes` unless
you intend to delete that database.

The backend and database settings are provided at runtime; secrets should not
be added to the Docker image or committed to Git. The backend waits for the
database health check, applies Alembic migrations on startup, and exposes
`http://localhost:8000/health`.

## Migrations

```bash
bash scripts/run_migrations.sh
```

## API Endpoints
- `/health` - health check
- `/auth/login` - obtain JWT tokens
- `/auth/refresh` - refresh tokens
- `/roles` - manage roles
- `/users` - manage users
- `/companies` - manage companies
- `/customers` - manage customers
- `/products` - manage products
- `/quotations` - manage quotations
