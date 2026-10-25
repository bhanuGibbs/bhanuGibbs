from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

app = FastAPI(
    title=settings.app_name,
    description="Enterprise Quotation Management System API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    configure_logging()
    await create_initial_data()


@app.get("/health", response_class=JSONResponse)
async def health_check() -> JSONResponse:
    """Return service health status."""
    return JSONResponse(status_code=200, content={"status": "ok"})
