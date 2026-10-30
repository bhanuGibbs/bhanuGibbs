from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from app.models.company import Company
from app.models.role import Role
from app.schemas.user import UserPlanUpdate, UserRead, UserRegister
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


async def _to_user_read(user, session: AsyncSession) -> UserRead:
    role = await session.get(Role, user.role_id)
    company = await session.get(Company, user.company_id) if user.company_id else None
    return UserRead.model_validate({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "mobile_number": user.mobile_number,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "role_id": user.role_id,
        "role": role.name if role else None,
        "company_id": user.company_id,
        "is_profile_complete": user.is_profile_complete,
        "subscription_plan": user.subscription_plan,
        "company_name": company.name if company else None,
        "company_address": company.address if company else None,
        "company_phone_number": company.phone_number if company else None,
        "company_email": company.email if company else None,
        "company_website": company.website if company else None,
        "company_gstin": company.gstin if company else None,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    })


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserRegister,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> UserRead:
    """Allow only a Super Admin to create a standard Sales account."""
    service = UserService(session)
    if current_user["role"] != "Super Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    user = await service.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        role_name="Sales",
        is_superuser=False,
    )
    return await _to_user_read(user, session)


@router.get("/admin", response_model=list[UserRead])
async def list_users_for_admin(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[UserRead]:
    """List users for administrators managing subscription plans."""
    if current_user["role"] not in {"Admin", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )
    if current_user["role"] == "Admin" and not current_user["company_id"]:
        return []
    company_id = current_user["company_id"] if current_user["role"] == "Admin" else None
    users = await UserService(session).list_users(company_id)
    return [await _to_user_read(user, session) for user in users]


@router.patch("/{user_id}/plan", response_model=UserRead)
async def update_user_plan(
    user_id: str,
    payload: UserPlanUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> UserRead:
    """Change a user's paid subscription plan as an administrator."""
    if current_user["role"] not in {"Admin", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )
    if current_user["role"] == "Admin" and not current_user["company_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Company profile is required.")
    company_id = current_user["company_id"] if current_user["role"] == "Admin" else None
    user = await UserService(session).update_subscription_plan(
        user_id, payload.subscription_plan, company_id=company_id
    )
    return await _to_user_read(user, session)


@router.get("/", response_model=list[UserRead])
async def list_users(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[UserRead]:
    """Return only the authenticated user's own profile."""
    service = UserService(session)
    user = await service.get_user_by_id(current_user["id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return [await _to_user_read(user, session)]
