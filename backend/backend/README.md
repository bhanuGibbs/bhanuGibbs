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

```bash
docker compose -f ../docker/docker-compose.yml up --build
```

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
