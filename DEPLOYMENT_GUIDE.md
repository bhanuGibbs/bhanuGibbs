# Deploying the Quotation Generator

This guide deploys the frontend to Vercel, the FastAPI backend to Render, and
the PostgreSQL database to Neon. Deploy the database first, then the backend,
then the frontend so you can configure each service with the URL from the
previous step.

## 1. Prepare the repository

Push the application to a GitHub repository that Vercel and Render can access.
Do not commit `.env` files, database passwords, or JWT secrets. Use each
provider's environment-variable settings for deployment secrets.

## 2. Create the Neon PostgreSQL database

1. Create a Neon project and database from the Neon dashboard.
2. In **Connect**, choose the pooled connection option if available and copy
   the host, database name, username, and password. Keep these private.
3. Create the backend `DATABASE_URL` from those values in this format:

   ```text
   postgresql+asyncpg://USER:PASSWORD@HOST/DATABASE?ssl=require
   ```

   The application uses SQLAlchemy's `asyncpg` driver. Use the Neon hostname
   and credentials exactly as shown in the dashboard; replace the usual
   `postgresql://` scheme with `postgresql+asyncpg://`. Use `ssl=require` (not
   `sslmode=require`) and do not include unsupported query options copied from
   a generic PostgreSQL connection string. URL-encode special characters in
   the username or password (for example, `@` becomes `%40`).

Keep the database URL available for the Render configuration in the next step.

## 3. Deploy the backend to Render

1. In Render, create a **Web Service** and connect the GitHub repository.
2. Configure the service:

   | Setting | Value |
   | --- | --- |
   | Root Directory | `backend/backend` |
   | Runtime | Python |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | Health Check Path | `/health` |

3. Add these environment variables in the Render service settings:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon connection URL from step 2 |
   | `JWT_SECRET_KEY` | A newly generated, long, random secret |
   | `JWT_ALGORITHM` | `HS256` |
   | `ENVIRONMENT` | `production` |
   | `DEBUG` | `False` |
   | `CORS_ORIGINS` | `https://YOUR-VERCEL-DOMAIN` |

   For example, generate a secret locally in PowerShell with:

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

   Use the actual Vercel domain in `CORS_ORIGINS` after creating the Vercel
   project. If you add a custom domain, add it as another comma-separated
   origin. Do not add a trailing slash to an origin.

4. Create the service and wait for its first deploy to complete. The backend
   applies its Alembic migrations and seeds default roles during startup.
5. Copy the Render service's public URL, such as
   `https://your-service.onrender.com`, and check
   `https://your-service.onrender.com/health`. It should return
   `{"status":"ok"}`.

Use Render's environment settings for secrets; do not copy local `.env` files
into the deployed service. Free service availability, sleep behavior, and
resource limits depend on the providers' current plans.

## 4. Deploy the frontend to Vercel

1. In Vercel, add a project and import the same GitHub repository.
2. Configure the project:

   | Setting | Value |
   | --- | --- |
   | Framework Preset | Vite |
   | Root Directory | `.` (repository root) |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

3. Add the environment variable below for **Production**, **Preview**, and
   **Development** as appropriate. Set it to the Render public URL with no
   trailing slash and no `/api` suffix:

   ```text
   VITE_API_BASE=https://your-service.onrender.com
   ```

4. Deploy the project. Vercel includes `vercel.json` from the repository to
   send client-side routes back to the React application.
5. Copy the Vercel production domain, then update Render's `CORS_ORIGINS` to
   that exact `https://` origin and redeploy/restart the backend. If you change
   `VITE_API_BASE`, trigger a new Vercel deployment because Vite embeds it at
   build time.

## 5. Smoke-test the deployed app

1. Open the Vercel URL and register a new account.
2. Complete company setup, then add a customer and product and create a
   quotation.
3. Refresh a page such as `/quotations` directly; it should still load.
4. Check that the Render service is healthy and that its logs contain no
   database, migration, or CORS errors.

The Neon database starts empty. Local SQLite/PostgreSQL data is not copied to
Neon automatically. Export and migrate any data you need separately before
using the deployed application.
