from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator
from app.schemas.contact_fields import NameField, PhoneNumber, Pincode, Gstin


class CustomerBase(BaseModel):
    """Shared customer schema fields."""

    name: NameField = Field(...)

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str | None) -> str | None:
        if v is None:
            raise ValueError("Customer name is required")
        return v

    email: EmailStr | None = None
    phone_number: PhoneNumber = None
    address: str | None = Field(default=None, max_length=512)
    company_name: NameField = None
    gstin: Gstin = None
    country: NameField = None
    state: NameField = None
    city: NameField = None
    pincode: Pincode = None


class CustomerCreate(CustomerBase):
    """Properties required to create a new customer."""


class CustomerUpdate(BaseModel):
    """Properties for updating a customer."""

    name: NameField = None
    email: EmailStr | None = None
    phone_number: PhoneNumber = None
    address: str | None = Field(default=None, max_length=512)
    company_name: NameField = None
    gstin: Gstin = None
    country: NameField = None
    state: NameField = None
    city: NameField = None
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
