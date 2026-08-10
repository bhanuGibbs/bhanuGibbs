from __future__ import annotations

from fastapi import HTTPException
from pydantic import ValidationError

from app.services.exceptions import BadRequestError, ConflictError, NotFoundError, ServiceError


def map_exception_to_http(exc: Exception) -> HTTPException:
    """Convert service exceptions to HTTP exceptions."""
    if isinstance(exc, NotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, ConflictError):
        return HTTPException(status_code=409, detail=str(exc))
    if isinstance(exc, BadRequestError) or isinstance(exc, ValidationError):
        return HTTPException(status_code=400, detail=str(exc))
    if isinstance(exc, ServiceError):
        return HTTPException(status_code=400, detail=str(exc))
    return HTTPException(status_code=500, detail="Internal server error")
