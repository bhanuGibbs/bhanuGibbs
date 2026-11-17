from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# Valid business types for the central product repository
VALID_BUSINESS_TYPES = [
    "Paint Store",
    "Grocery Store",
    "Hardware Store",
    "Electrical Store",
    "Medical Store",
    "Garments Store",
    "Mobile Store",
]


class MasterProductCreate(BaseModel):
    business_type: str = Field(..., min_length=1, max_length=50)
    product_name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    barcode: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    unit: str | None = Field(default=None, max_length=50)
    description: str | None = None

    @field_validator("business_type")
    @classmethod
    def validate_business_type(cls, v: str) -> str:
        if v not in VALID_BUSINESS_TYPES:
            raise ValueError(f"business_type must be one of: {', '.join(VALID_BUSINESS_TYPES)}")
        return v


class MasterProductUpdate(BaseModel):
    business_type: str | None = Field(default=None, max_length=50)
    product_name: str | None = Field(default=None, max_length=255)
    sku: str | None = Field(default=None, max_length=100)
    barcode: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    unit: str | None = Field(default=None, max_length=50)
    description: str | None = None
    is_active: bool | None = None


class MasterProductRead(BaseModel):
    id: UUID | str
    business_type: str
    product_name: str
    sku: str
    barcode: str | None = None
    category: str | None = None
    unit: str | None = None
    description: str | None = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MasterProductSearchResult(BaseModel):
    """Paginated search result for master products."""
    products: List[MasterProductRead]
    total: int
    skip: int
    limit: int


class MasterProductImportItem(BaseModel):
    """Single row from bulk import CSV/Excel."""
    business_type: str = Field(..., min_length=1, max_length=50)
    product_name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    barcode: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    unit: str | None = Field(default=None, max_length=50)
    description: str | None = None

    @field_validator("business_type")
    @classmethod
    def validate_business_type(cls, v: str) -> str:
        if v not in VALID_BUSINESS_TYPES:
            raise ValueError(f"business_type must be one of: {', '.join(VALID_BUSINESS_TYPES)}")
        return v


class MasterProductImportResult(BaseModel):
    """Result summary from bulk import."""
    created: int = 0
    updated: int = 0
    errors: List[str] = []


class MasterProductDeactivate(BaseModel):
    """Response after deactivating a master product."""
    id: UUID | str
    is_active: bool = False


class MasterProductBusinessTypes(BaseModel):
    """List of valid business types."""
    business_types: List[str] = VALID_BUSINESS_TYPES
