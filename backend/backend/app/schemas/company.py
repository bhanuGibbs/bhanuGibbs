from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl
from app.schemas.contact_fields import PhoneNumber, Pincode


class CompanyBase(BaseModel):
    """Shared company schema fields."""

    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = Field(default=None, max_length=512)
    phone_number: PhoneNumber = None
    email: EmailStr | None = None
    website: HttpUrl | None = None
    gstin: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    pincode: Pincode = None


class CompanyCreate(CompanyBase):
    """Properties required to create a new company."""


class CompanyRead(CompanyBase):
    """Properties returned in company responses."""

    id: UUID
    phone_number: str | None = None
    pincode: str | None = None
    created_at: datetime
    updated_at: datetime
    currency: str | None = None

    model_config = {
        "from_attributes": True,
    }
