from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class DealerCreate(BaseModel):
    dealer_code: str | None = Field(default=None, max_length=50)
    name: str = Field(min_length=1, max_length=255)
    contact_name: str | None = Field(default=None, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone_number: str | None = Field(default=None, max_length=50)
    address: str | None = None
    gstin: str | None = Field(default=None, max_length=20)
    territory: str | None = Field(default=None, max_length=120)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Dealer name is required.")
        return value


class DealerUpdate(BaseModel):
    dealer_code: str | None = Field(default=None, max_length=50)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    contact_name: str | None = Field(default=None, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone_number: str | None = Field(default=None, max_length=50)
    address: str | None = None
    gstin: str | None = Field(default=None, max_length=20)
    territory: str | None = Field(default=None, max_length=120)
    is_active: bool | None = None


class ProductCreate(BaseModel):
    product_code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=120)
    description: str | None = None
    unit: str = Field(default="unit", min_length=1, max_length=50)
    unit_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    reorder_level: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=3)
    opening_stock: Decimal = Field(default=Decimal("0"), ge=0, max_digits=14, decimal_places=3)

    @field_validator("product_code", "name", "unit")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field is required.")
        return value


class ProductUpdate(BaseModel):
    product_code: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=120)
    description: str | None = None
    unit: str | None = Field(default=None, min_length=1, max_length=50)
    unit_price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    reorder_level: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=3)
    is_active: bool | None = None


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(gt=0, max_digits=12, decimal_places=3)


class OrderCreate(BaseModel):
    dealer_id: UUID
    items: list[OrderItemCreate] = Field(min_length=1, max_length=100)
    notes: str | None = None
    submit: bool = False


class OrderUpdate(BaseModel):
    dealer_id: UUID | None = None
    items: list[OrderItemCreate] | None = Field(default=None, min_length=1, max_length=100)
    notes: str | None = None


class OrderReject(BaseModel):
    reason: str = Field(min_length=1, max_length=2000)

    @field_validator("reason")
    @classmethod
    def reason_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("A rejection reason is required.")
        return value


class InventoryAdjustment(BaseModel):
    product_id: UUID
    quantity_delta: Decimal = Field(max_digits=14, decimal_places=3)
    reason: str = Field(min_length=1, max_length=2000)
    transaction_type: Literal["Purchase", "Manual Adjustment", "Return"] = "Manual Adjustment"

    @field_validator("reason")
    @classmethod
    def reason_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("A reason is required.")
        return value

    @field_validator("quantity_delta")
    @classmethod
    def quantity_must_not_be_zero(cls, value: Decimal) -> Decimal:
        if value == 0:
            raise ValueError("Quantity change cannot be zero.")
        return value


class OrderStatusUpdate(BaseModel):
    status: Literal["Processing", "Dispatched", "Delivered", "Cancelled"]


class OrderRead(BaseModel):
    id: UUID
    order_number: str
    dealer_id: UUID
    dealer_name: str
    sales_rep_id: UUID
    sales_rep_name: str
    status: str
    total_amount: Decimal
    notes: str | None
    rejection_reason: str | None
    approved_at: datetime | None
    created_at: datetime
    items: list[dict]


class NotificationRead(BaseModel):
    id: UUID
    event_type: str
    message: str
    resource_id: UUID | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
