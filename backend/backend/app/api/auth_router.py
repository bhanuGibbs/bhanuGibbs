from __future__ import annotations

import secrets
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from app.models.company import Company
from app.models.role import Role
from app.security import create_access_token, create_refresh_token, decode_token
from app.schemas.company import CompanyCreate, CompanyRead
from app.schemas.user import (
    ForgotPasswordRequest,
    PasswordResetRequest,
    Token,
    TokenRefreshRequest,
    UserRead,
    UserProfileUpdate,
    UserRegister,
)
from app.services.auth_session_service import AuthSessionService
from app.services.email_service import EmailConfigurationError, EmailDeliveryError, EmailService
from app.services.exceptions import BadRequestError, ConflictError, NotFoundError
from app.services.company_service import CompanyService
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegister,
    session: AsyncSession = Depends(get_db_session),
) -> UserRead:
    """Register a new backend user account."""
    service = UserService(session)
    user = await service.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        mobile_number=payload.mobile_number,
        role_name="Sales",
        is_superuser=False,
    )
    role = await session.get(Role, user.role_id)
    company = await session.get(Company, user.company_id) if user.company_id else None
    user_data = {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "mobile_number": user.mobile_number,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "role_id": str(user.role_id),
        "role": role.name if role else None,
        "company_id": str(user.company_id) if user.company_id else None,
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
    }
    return UserRead.model_validate(user_data)


@router.post("/login", response_model=Token)
async def login(
    username: str = Form(...),
    password: str = Form(...),
    session: AsyncSession = Depends(get_db_session),
) -> Token:
    """Authenticate a user and return JWT tokens."""
    service = UserService(session)
    user = await service.authenticate_user(username=username, password=password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    role = await session.get(Role, user.role_id)
    role_name = role.name if role else "Viewer"
    token_id = secrets.token_urlsafe(32)
    token_payload = {
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": role_name,
        "company_id": str(user.company_id) if user.company_id else None,
        "is_profile_complete": user.is_profile_complete,
        "refresh_token_id": token_id,
    }
    refresh_token = create_refresh_token(token_payload)
    await AuthSessionService(session).create_session(str(user.id), refresh_token, token_id)

    return Token(
        access_token=create_access_token(token_payload),
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(payload: TokenRefreshRequest, session: AsyncSession = Depends(get_db_session)) -> Token:
    """Refresh JWT tokens using a valid refresh token."""
    try:
        token_payload = decode_token(payload.refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        )

    if token_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token is not a refresh token.",
        )

    token_id = token_payload.get("refresh_token_id")
    if not token_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh session.",
        )

    auth_session_service = AuthSessionService(session)
    stored_session = await auth_session_service.get_session_by_token_id(token_id)
    if not stored_session or stored_session.refresh_token != payload.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is not valid.",
        )

    if stored_session.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired.",
        )

    await auth_session_service.revoke_session(token_id)

    new_token_id = secrets.token_urlsafe(32)
    new_payload = {
        "sub": token_payload["sub"],
        "username": token_payload["username"],
        "email": token_payload.get("email", ""),
        "role": token_payload["role"],
        "company_id": token_payload.get("company_id"),
        "is_profile_complete": token_payload.get("is_profile_complete", False),
        "refresh_token_id": new_token_id,
    }
    new_refresh_token = create_refresh_token(new_payload)
    await auth_session_service.create_session(str(token_payload["sub"]), new_refresh_token, new_token_id)

    return Token(
        access_token=create_access_token(new_payload),
        refresh_token=new_refresh_token,
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    payload: TokenRefreshRequest,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """Revoke a refresh session and log the user out."""
    try:
        token_payload = decode_token(payload.refresh_token)
    except ValueError:
        return {"message": "Logged out successfully."}

    if token_payload.get("type") != "refresh":
        return {"message": "Logged out successfully."}

    token_id = token_payload.get("refresh_token_id")
    if not token_id:
        return {"message": "Logged out successfully."}

    auth_session_service = AuthSessionService(session)
    try:
        await auth_session_service.revoke_session(token_id)
    except NotFoundError:
        pass

    return {"message": "Logged out successfully."}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    payload: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """Send password-reset instructions without returning the reset token."""
    email_service = EmailService()
    try:
        email_service.ensure_password_reset_configured()
    except EmailConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error

    service = UserService(session)
    try:
        reset_token = await service.create_password_reset_token(payload.email)
    except NotFoundError:
        return {
            "message": "If an account exists for that email, password reset instructions will be sent."
        }

    try:
        await email_service.send_password_reset_email(payload.email, reset_token)
    except EmailDeliveryError as error:
        logger.error("Password reset email delivery failed (%s).", type(error).__name__)
        try:
            await service.invalidate_password_reset_token(reset_token)
        except Exception:
            logger.exception("Failed to invalidate an undelivered password reset token.")

    return {
        "message": "If an account exists for that email, password reset instructions will be sent."
    }


@router.post("/setup-company", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
async def setup_company(
    payload: CompanyCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> CompanyRead:
    """Create the first company profile for a newly registered user."""
    user_service = UserService(session)
    company_service = CompanyService(session)

    user = await user_service.get_user_by_id(current_user["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.is_profile_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company details are already completed.",
        )

    company = await company_service.create_company(
        name=payload.name,
        address=payload.address,
        phone_number=payload.phone_number,
        email=payload.email,
        website=payload.website,
        gstin=payload.gstin,
        country=payload.country,
        state=payload.state,
        city=payload.city,
        pincode=payload.pincode,
    )

    user.company_id = company.id
    user.is_profile_complete = True
    await session.commit()

    # Build a plain-serializable response dict so Pydantic does not fail
    # when converting DB-native types (UUID, datetime) to strings.
    company_data = {
        "id": str(company.id),
        "name": company.name,
        "address": company.address,
        "phone_number": company.phone_number,
        "email": company.email,
        "website": company.website,
        "gstin": company.gstin,
        "country": company.country,
        "state": company.state,
        "city": company.city,
        "pincode": company.pincode,
        "created_at": str(company.created_at),
        "updated_at": str(company.updated_at),
    }

    return CompanyRead.model_validate(company_data)


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    payload: PasswordResetRequest,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """Reset a user's password using a valid reset token."""
    service = UserService(session)
    try:
        await service.reset_password(payload.token, payload.new_password)
    except BadRequestError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    return {"message": "Password has been updated successfully."}


@router.get("/me", response_model=UserRead)
async def read_current_user(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> UserRead:
    """Return data for the authenticated user."""
    service = UserService(session)
    user = await service.get_user_by_id(current_user["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    role = await session.get(Role, user.role_id)
    company = await session.get(Company, user.company_id) if user.company_id else None
    user_data = {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "mobile_number": user.mobile_number,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "role_id": str(user.role_id),
        "role": role.name if role else None,
        "company_id": str(user.company_id) if user.company_id else None,
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
    }
    return UserRead.model_validate(user_data)


@router.patch("/me", response_model=UserRead)
async def update_current_user(
    payload: UserProfileUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> UserRead:
    """Update the authenticated user's own contact details only."""
    changes = payload.model_dump(exclude_unset=True)
    if any(changes.get(field) is None for field in ("username", "email") if field in changes):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username and email cannot be cleared.",
        )
    try:
        await UserService(session).update_profile(current_user["id"], changes)
    except ConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    return await read_current_user(current_user, session)
