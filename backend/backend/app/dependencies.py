from __future__ import annotations

from typing import AsyncGenerator

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.security import decode_token
from app.services.user_service import UserService

security_scheme = HTTPBearer(auto_error=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an asynchronous database session for request handling."""
    async with get_session() as session:
        yield session


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security_scheme),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str] | None:
    """Validate a bearer token when present; otherwise return None for local registration flows."""
    if credentials is None:
        return None

    token = credentials.credentials
    try:
        payload = decode_token(token)
    except ValueError:
        return None

    if payload.get("type") != "access":
        return None

    user_service = UserService(session)
    user = await user_service.get_user_by_id(payload.get("sub", ""))
    if not user:
        return None

    return {
        "id": payload["sub"],
        "username": payload["username"],
        "role": payload["role"],
        "company_id": payload.get("company_id"),
    }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security_scheme),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """Validate the bearer token and return the current user payload."""
    current_user = await get_optional_current_user(credentials, session)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
        )
    return current_user
