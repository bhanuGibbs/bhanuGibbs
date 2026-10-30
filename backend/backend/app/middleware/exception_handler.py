from __future__ import annotations

import logging
from uuid import uuid4

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.exceptions import map_exception_to_http

logger = logging.getLogger(__name__)


async def http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for the application."""
    http_exception = map_exception_to_http(exc)
    if http_exception.status_code >= 500:
        error_id = uuid4().hex[:12]
        logger.error(
            "Unhandled exception reference_id=%s while processing request %s %s",
            error_id,
            request.method,
            request.url,
            exc_info=exc,
        )
        return JSONResponse(
            status_code=http_exception.status_code,
            content={
                "detail": f"Internal server error. Reference ID: {error_id}.",
                "error_id": error_id,
            },
        )

    logger.error("Request failed while processing %s %s", request.method, request.url, exc_info=exc)
    return JSONResponse(
        status_code=http_exception.status_code,
        content={"detail": http_exception.detail},
    )
