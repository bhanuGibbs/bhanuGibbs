from __future__ import annotations

import base64
import binascii
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator
from app.schemas.contact_fields import NameField, PhoneNumber, Pincode, Gstin


class CompanyBase(BaseModel):
    """Shared company schema fields."""

    name: NameField = Field(...)

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str | None) -> str | None:
        if v is None:
            raise ValueError("Company name is required")
        return v

    address: str | None = Field(default=None, max_length=512)
    phone_number: PhoneNumber = None
    email: str | None = None
    website: str | None = None
    gstin: Gstin = None
    country: NameField = None
    state: NameField = None
    city: NameField = None
    pincode: Pincode = None
    business_profile: str = Field(default="invoice", pattern="^(invoice|pos|delivery_challan|sales_inventory)$")


class CompanyCreate(CompanyBase):
    """Properties required to create a new company."""

    logo_data: str | None = Field(
        default=None,
        max_length=1_400_000,
        pattern=r"^data:image/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$",
    )
    seal_data: str | None = Field(
        default=None,
        max_length=1_400_000,
        pattern=r"^data:image/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$",
    )

    @field_validator("logo_data", "seal_data")
    @classmethod
    def image_data_matches_type(cls, value: str | None) -> str | None:
        if value is None:
            return value

        mime_type, _, encoded_image = value.partition(",")
        try:
            image = base64.b64decode(encoded_image, validate=True)
        except binascii.Error as error:
            raise ValueError("Company logo and seal must contain valid PNG or JPEG data.") from error

        if len(image) > 1_000_000:
            raise ValueError("Company logo and seal images must be smaller than 1 MB.")

        expected_signature = b"\x89PNG\r\n\x1a\n" if mime_type == "data:image/png;base64" else b"\xff\xd8\xff"
        if not image.startswith(expected_signature):
            raise ValueError("Company logo and seal must contain valid PNG or JPEG data.")

        return value


class CompanyRead(CompanyBase):
    """Properties returned in company responses."""

    id: UUID
    phone_number: str | None = None
    pincode: str | None = None
    gstin: str | None = None
    business_profile: str = "invoice"
    created_at: datetime
    updated_at: datetime
    currency: str | None = None

    model_config = {
        "from_attributes": True,
    }
