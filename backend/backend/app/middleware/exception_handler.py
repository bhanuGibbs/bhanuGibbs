from __future__ import annotations

import logging

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.exceptions import map_exception_to_http

logger = logging.getLogger(__name__)


async def http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for the application."""
    logger.error("Unhandled exception while processing request %s %s", request.method, request.url, exc_info=exc)
    http_exception = map_exception_to_http(exc)
    return JSONResponse(
        status_code=http_exception.status_code,
        content={"detail": http_exception.detail},
    )
