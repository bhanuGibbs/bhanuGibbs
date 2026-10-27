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

From the repository root, use `backend/backend/.env` for Compose and backend
settings. Keep `DATABASE_URL` pointed at the host database for local runs, and
set `DATABASE_URL_DOCKER` to the same database credentials with host `db` and
port `5432`. URL-encode special characters in the database password. Configure
SMTP credentials in this same file.

PowerShell, from the repository root:

```powershell
if (-not (Test-Path backend\backend\.env)) { Copy-Item backend\backend\.env.example backend\backend\.env }
docker compose --env-file backend\backend\.env up --build
```

Unix-like shells, from the repository root:

```bash
[ -f backend/backend/.env ] || cp backend/backend/.env.example backend/backend/.env
docker compose --env-file backend/backend/.env up --build
```

To stop the services while preserving PostgreSQL data:

```bash
docker compose --env-file backend/backend/.env down
```

PostgreSQL data is stored in a named volume. Do not use `down --volumes` unless
you intend to delete that database.

The UI is served at `http://localhost:8080`, the backend health endpoint is at
`http://localhost:8000/health`, and Nginx forwards UI `/api` requests to the
backend container. The UI starts after the backend is healthy; the backend
waits for PostgreSQL and applies Alembic migrations on startup. Secrets stay
in the ignored env files and are not copied into the Docker images.

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
