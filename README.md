# KeelBill Ledger

A full-stack application for managing customers, products, quotations, and invoices. The React/Vite frontend connects to a FastAPI backend with JWT authentication and supports PDF generation.

## Stack

- Frontend: React 18, Vite, Tailwind CSS, React Router
- Backend: FastAPI, SQLAlchemy, Alembic
- Database: PostgreSQL for deployment; SQLite can be configured for local development
- PDFs: `@react-pdf/renderer`

## Run locally

Follow [RUN_INSTRUCTIONS.txt](RUN_INSTRUCTIONS.txt) for Windows setup, database configuration, migrations, and frontend/backend startup. The frontend defaults to `http://127.0.0.1:3001`; the API defaults to `http://127.0.0.1:8000`.

## Deploy

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for Vercel, Render, and Neon configuration. Keep database URLs and signing secrets in environment variables; do not commit them.

## Verify changes

From the repository root, run frontend tests and build:

```powershell
node --test src/utils/*.test.js
npm run build
```

Run backend tests from `backend\backend` using the project virtual environment:

```powershell
.\venv\Scripts\python.exe -m pytest -q
```

The latest local regression and smoke-test results are in [QUALITY_CHECK_REPORT.md](QUALITY_CHECK_REPORT.md).
