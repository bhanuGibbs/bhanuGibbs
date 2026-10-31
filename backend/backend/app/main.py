from __future__ import annotations

import os
import time
import uuid
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.startup import create_initial_data
from app.middleware.exception_handler import http_exception_handler
from app.api.auth_router import router as auth_router
from app.api.company_router import router as company_router
from app.api.customer_router import router as customer_router
from app.api.product_router import router as product_router
from app.api.quotation_router import router as quotation_router
from app.api.role_router import router as role_router
from app.api.user_router import router as user_router

settings = get_settings()
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3001,http://127.0.0.1:3001,"
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

# Rate limiter for authentication endpoints (imported from core.rate_limit)

app = FastAPI(
    title=settings.app_name,
    description="Enterprise Quotation Management System API.",
    version="0.1.0",
)

# Rate limit exceeded handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Structured request/response logging middleware."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start_time = time.perf_counter()

        # Skip health checks and static assets from logging
        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            response = await call_next(request)
            return response

        response = await call_next(request)
        process_time = (time.perf_counter() - start_time) * 1000

        logging.getLogger("request").info(
            "%s %s %d %.1fms req_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            process_time,
            request_id,
        )
        return response


app.add_middleware(RequestLoggingMiddleware)

app.add_exception_handler(Exception, http_exception_handler)

app.include_router(auth_router)
app.include_router(company_router)
app.include_router(customer_router)
app.include_router(product_router)
app.include_router(quotation_router)
app.include_router(role_router)
app.include_router(user_router)


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize application resources on startup."""
    print("Starting app")
    configure_logging()
    print("Before create_initial_data")
    await create_initial_data()
    print("Startup completed")


@app.get("/health", response_class=JSONResponse)
async def health_check() -> JSONResponse:
    """Return service health status."""
    return JSONResponse(status_code=200, content={"status": "ok"})
