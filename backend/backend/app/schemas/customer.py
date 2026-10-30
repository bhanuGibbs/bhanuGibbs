from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field
from app.schemas.contact_fields import PhoneNumber, Pincode


class CustomerBase(BaseModel):
    """Shared customer schema fields."""

    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: PhoneNumber = None
    address: str | None = Field(default=None, max_length=512)
    company_name: str | None = Field(default=None, max_length=255)
    gstin: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    pincode: Pincode = None


class CustomerCreate(CustomerBase):
    """Properties required to create a new customer."""


class CustomerUpdate(BaseModel):
    """Properties for updating a customer."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: PhoneNumber = None
    address: str | None = Field(default=None, max_length=512)
    company_name: str | None = Field(default=None, max_length=255)
    gstin: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    pincode: Pincode = None


class CustomerRead(CustomerBase):
    """Properties returned in customer responses."""

    id: UUID
    phone_number: str | None = None
    pincode: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }
