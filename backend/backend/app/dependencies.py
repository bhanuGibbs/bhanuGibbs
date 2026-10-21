from __future__ import annotations

from typing import AsyncGenerator

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.role import Role
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
    if not user or not user.is_active:
        return None

    role = await session.get(Role, user.role_id)

    return {
        "id": str(user.id),
        "username": user.username,
        "role": role.name if role else "Viewer",
        "company_id": str(user.company_id) if user.company_id else None,
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
