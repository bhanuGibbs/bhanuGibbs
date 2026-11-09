from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ChallanProductBase(BaseModel):
    """Shared challan product schema fields."""

    crop: str = Field(..., min_length=1, max_length=255)

    @field_validator("crop")
    @classmethod
    def crop_must_not_be_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Crop name cannot be whitespace only")
        return v

    variety: str | None = Field(default=None, max_length=255)
    seed_class: str | None = Field(default=None, max_length=100)
    lot_no: str | None = Field(default=None, max_length=100)
    unit_size: str | None = Field(default=None, max_length=50)
    unit_per_sack_box: int | None = Field(default=None, ge=1)
    sack_box: int | None = Field(default=None, ge=1)
    value: Decimal = Field(..., ge=Decimal("0.01"))


class ChallanProductCreate(ChallanProductBase):
    """Properties required to create a new challan product."""


class ChallanProductUpdate(BaseModel):
    """Properties for updating a challan product."""

    crop: str | None = Field(default=None, min_length=1, max_length=255)

    @field_validator("crop")
    @classmethod
    def crop_must_not_be_whitespace(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Crop name cannot be whitespace only")
        return v

    variety: str | None = Field(default=None, max_length=255)
    seed_class: str | None = Field(default=None, max_length=100)
    lot_no: str | None = Field(default=None, max_length=100)
    unit_size: str | None = Field(default=None, max_length=50)
    unit_per_sack_box: int | None = Field(default=None, ge=1)
    sack_box: int | None = Field(default=None, ge=1)
    value: Decimal | None = Field(default=None, ge=Decimal("0.01"))


class ChallanProductRead(ChallanProductBase):
    """Properties returned in challan product responses."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }
