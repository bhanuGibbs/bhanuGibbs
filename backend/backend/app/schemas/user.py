from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_serializer


class UserBase(BaseModel):
    """Shared user schema fields."""

    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    mobile_number: str | None = Field(default=None, max_length=50)


class UserCreate(UserBase):
    """Fields required to create a new user."""

    password: str = Field(..., min_length=8)
    role_name: str = Field(..., min_length=3, max_length=50)
    is_superuser: bool = Field(default=False)


class UserRegister(BaseModel):
    """Fields required for self-registration."""

    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    mobile_number: str | None = Field(default=None, max_length=50)


class UserProfileUpdate(BaseModel):
    """Editable self-service profile fields; role and access flags are excluded."""

    username: str | None = Field(default=None, min_length=3, max_length=100)
    email: EmailStr | None = None
    mobile_number: str | None = Field(default=None, max_length=50)


class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password."""

    email: EmailStr


class PasswordResetRequest(BaseModel):
    """Request schema for password reset."""

    token: str
    new_password: str = Field(..., min_length=8)


class TokenRefreshRequest(BaseModel):
    """Request schema for refresh token."""

    refresh_token: str


class UserRead(UserBase):
    """Fields returned in user responses."""

    id: UUID | str
    is_active: bool
    is_superuser: bool
    role_id: UUID | str
    role: str | None = None
    company_id: UUID | str | None = None
    is_profile_complete: bool = False
    company_name: str | None = None
    company_address: str | None = None
    company_phone_number: str | None = None
    company_email: str | None = None
    company_website: str | None = None
    company_gstin: str | None = None
    created_at: datetime
    updated_at: datetime

    @field_serializer("id", "role_id", when_used="json")
    def serialize_uuid(self, value: UUID | str) -> str:
        return str(value)

    @field_serializer("created_at", "updated_at", when_used="json")
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat()

    model_config = {
        "from_attributes": True,
    }


class Token(BaseModel):
    """JWT token response schema."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
