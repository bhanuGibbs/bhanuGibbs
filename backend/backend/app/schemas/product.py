from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    """Shared product schema fields."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1024)
    price: Decimal = Field(..., ge=Decimal("0.01"))
    sku: str | None = Field(default=None, max_length=100)
    gst_percentage: Decimal | None = Field(default=None, ge=0, le=100)
    unit: str | None = Field(default=None, max_length=50)
    hsn_code: str | None = Field(default=None, max_length=50)


class ProductCreate(ProductBase):
    """Properties required to create a new product."""


class ProductUpdate(BaseModel):
    """Properties for updating a product."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1024)
    price: Decimal | None = Field(default=None, ge=Decimal("0.01"))
    sku: str | None = Field(default=None, max_length=100)
    gst_percentage: Decimal | None = Field(default=None, ge=0, le=100)
    unit: str | None = Field(default=None, max_length=50)
    hsn_code: str | None = Field(default=None, max_length=50)


class ProductRead(ProductBase):
    """Properties returned in product responses."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }
