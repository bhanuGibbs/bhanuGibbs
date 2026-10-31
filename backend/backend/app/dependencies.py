from __future__ import annotations

from typing import AsyncGenerator

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.role import Role
from app.security import decode_token
from app.services.user_service import UserService


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an asynchronous database session for request handling."""
    async with get_session() as session:
        yield session


def extract_bearer_token(request: Request) -> str | None:
    """Extract the Bearer token from the Authorization header."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header:
        return None
    parts = auth_header.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


async def get_optional_current_user(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str] | None:
    """Validate a bearer token when present; otherwise return None for local registration flows."""
    token = extract_bearer_token(request)
    if token is None:
        return None

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
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """Validate the bearer token and return the current user payload."""
    current_user = await get_optional_current_user(request, session)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
        )
    return current_user
