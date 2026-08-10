# Backend UI Integration

This folder keeps the UI-to-backend connection isolated so it can be reviewed independently.

## Files
- api.js — maps the UI quotation data to the backend form payload and submits it to the FastAPI endpoint.
- viteProxyConfig.js — example Vite proxy configuration for local development.

## Backend endpoint
- Health check: http://127.0.0.1:8000/health
- Quotation submit: http://127.0.0.1:8000/quotations/submit

## How to use
1. Start the backend from the Python project:
   - python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
2. Start the frontend and make sure the Vite proxy points to the backend.
3. Import the helpers from api.js when you want to connect the UI to the backend.
