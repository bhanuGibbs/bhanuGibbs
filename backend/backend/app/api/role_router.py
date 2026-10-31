from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from app.schemas.role import RoleCreate, RoleRead
from app.services.role_service import RoleService

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.post("/", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
async def create_role(
    payload: RoleCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> RoleRead:
    """Create a new role. Only Super Admin can create roles."""
    if current_user["role"] != "Super Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges.")
    service = RoleService(session)
    existing_role = await service.get_role_by_name(payload.name)
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Role with this name already exists.",
        )
    role = await service.create_role(name=payload.name, description=payload.description)
    return RoleRead.from_orm(role)


@router.get("/", response_model=list[RoleRead])
async def list_roles(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[RoleRead]:
    """List all roles. Admin and Super Admin can list."""
    if current_user["role"] not in {"Admin", "Super Admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges.")
    service = RoleService(session)
    roles = await service.list_roles()
    return [RoleRead.from_orm(role) for role in roles]
