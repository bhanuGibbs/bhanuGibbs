# Quotation Generator Backend

This backend application is built with FastAPI, SQLAlchemy, and PostgreSQL.

## Setup

1. Copy `.env.example` to `.env`.
2. Update `DATABASE_URL` and JWT values.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

## Health Check

Access `/health` to confirm the API is running.
