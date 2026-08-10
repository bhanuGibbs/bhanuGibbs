from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session, get_optional_current_user
from app.schemas.user import UserCreate, UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    current_user: dict[str, str] | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> UserRead:
    """Create a new user. Allow self-registration when no token is supplied; admin-role restrictions still apply for authenticated calls."""
    service = UserService(session)
    if current_user and current_user["role"] not in {"Super Admin", "Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    user = await service.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        role_name=payload.role_name,
        is_superuser=payload.is_superuser,
    )
    return UserRead.from_orm(user)


@router.get("/", response_model=list[UserRead])
async def list_users(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[UserRead]:
    """List users. Requires authentication."""
    service = UserService(session)
    if current_user["role"] not in {"Super Admin", "Admin", "Manager"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    users = await service.list_users()
    return [UserRead.from_orm(user) for user in users]
