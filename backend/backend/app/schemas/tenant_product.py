from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class TenantProductCreate(BaseModel):
    """Create a tenant product from a master product."""
    master_product_id: str = Field(..., min_length=1)
    selling_price: Decimal = Field(..., gt=0)
    stock_qty: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)


class TenantProductUpdate(BaseModel):
    """Update tenant product price and stock."""
    selling_price: Decimal | None = Field(default=None)
    stock_qty: int | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)

    @field_validator("selling_price")
    @classmethod
    def validate_selling_price(cls, v):
        if v is not None and v <= 0:
            raise ValueError("selling_price must be greater than 0")
        return v


class TenantProductRead(BaseModel):
    """Tenant product with master product details."""
    id: UUID | str
    company_id: UUID | str
    master_product_id: UUID | str | None = None
    selling_price: Decimal
    stock_qty: int
    low_stock_threshold: int
    created_at: datetime
    updated_at: datetime

    # Master product details (populated by service layer)
    product_name: str | None = None
    sku: str | None = None
    barcode: str | None = None
    category: str | None = None
    unit: str | None = None
    description: str | None = None
    business_type: str | None = None

    model_config = {"from_attributes": True}


class TenantProductListResult(BaseModel):
    """Paginated list of tenant products."""
    products: List[TenantProductRead]
    total: int
    skip: int
    limit: int


class TenantProductImportRequest(BaseModel):
    """Request to import a master product as a tenant product."""
    master_product_id: str
    selling_price: Decimal = Field(..., gt=0)
    stock_qty: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
