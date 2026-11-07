from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator
from app.schemas.contact_fields import HsnCode


class ProductBase(BaseModel):
    """Shared product schema fields."""

    name: str = Field(..., min_length=1, max_length=255)

    @field_validator("name")
    @classmethod
    def name_must_not_be_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Product name cannot be whitespace only")
        return v

    description: str | None = Field(default=None, max_length=1024)
    price: Decimal = Field(..., ge=Decimal("0.01"))
    sku: str | None = Field(default=None, max_length=100)
    gst_percentage: Decimal | None = Field(default=None, ge=0, le=100)
    unit: str | None = Field(default=None, max_length=50)
    hsn_code: HsnCode = None


class ProductCreate(ProductBase):
    """Properties required to create a new product."""


class ProductUpdate(BaseModel):
    """Properties for updating a product."""

    name: str | None = Field(default=None, min_length=1, max_length=255)

    @field_validator("name")
    @classmethod
    def name_must_not_be_whitespace(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Product name cannot be whitespace only")
        return v

    description: str | None = Field(default=None, max_length=1024)
    price: Decimal | None = Field(default=None, ge=Decimal("0.01"))
    sku: str | None = Field(default=None, max_length=100)
    gst_percentage: Decimal | None = Field(default=None, ge=0, le=100)
    unit: str | None = Field(default=None, max_length=50)
    hsn_code: HsnCode = None


class ProductRead(ProductBase):
    """Properties returned in product responses."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }
