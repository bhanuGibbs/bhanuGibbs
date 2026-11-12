from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class POSCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


class POSCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = None
    is_active: bool | None = None


class POSCategoryRead(BaseModel):
    id: UUID | str
    company_id: UUID | str
    name: str
    description: str | None = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class POSProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    barcode: str | None = Field(default=None, min_length=1, max_length=100)
    selling_price: Decimal = Field(..., gt=0)
    unit: str = Field(..., min_length=1, max_length=50)
    category_id: str | None = None
    description: str | None = None
    purchase_price: Decimal = Field(default=Decimal("0"), ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)


class POSProductUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    sku: str | None = Field(default=None, max_length=100)
    barcode: str | None = Field(default=None, max_length=100)
    selling_price: Decimal | None = Field(default=None, gt=0)
    unit: str | None = Field(default=None, max_length=50)
    category_id: str | None = None
    description: str | None = None
    purchase_price: Decimal | None = Field(default=None, ge=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class POSProductRead(BaseModel):
    id: UUID | str
    company_id: UUID | str
    category_id: UUID | str | None = None
    name: str
    sku: str
    barcode: str
    description: str | None = None
    purchase_price: Decimal
    selling_price: Decimal
    unit: str
    stock_quantity: int
    low_stock_threshold: int
    image_path: str | None = None
    is_active: bool = True
    created_by_id: UUID | str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class POSVariantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    selling_price: Decimal | None = Field(default=None, gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    sku: str | None = Field(default=None, max_length=100)
    barcode: str | None = Field(default=None, max_length=100)


class POSVariantRead(BaseModel):
    id: UUID | str
    product_id: UUID | str
    company_id: UUID | str
    name: str
    sku: str | None = None
    barcode: str | None = None
    selling_price: Decimal | None = None
    stock_quantity: int
    low_stock_threshold: int
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class POSCartItem(BaseModel):
    product_id: str
    variant_id: str | None = None
    product_name: str
    sku: str
    barcode: str
    quantity: int = Field(..., gt=0)
    unit_price: Decimal
    discount: Decimal = Field(default=Decimal("0"), ge=0)
    tax: Decimal = Field(default=Decimal("18"), ge=0)


class POSCheckoutRequest(BaseModel):
    items: list[POSCartItem]
    payment_method: str = Field(..., pattern="^(cash|upi|card|other)$")
    payment_amount: Decimal = Field(..., gt=0)
    discount: Decimal = Field(default=Decimal("0"), ge=0)
    notes: str | None = None


class POSTransactionItemRead(BaseModel):
    id: UUID | str
    product_name: str
    sku: str
    barcode: str
    quantity: int
    unit_price: Decimal
    discount: Decimal
    tax_amount: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class POSTransactionRead(BaseModel):
    id: UUID | str
    company_id: UUID | str
    transaction_number: str
    created_by_id: UUID | str | None = None
    created_by_name: str | None = None
    subtotal: Decimal
    discount: Decimal
    tax_amount: Decimal
    grand_total: Decimal
    payment_method: str
    payment_amount: Decimal
    status: str
    notes: str | None = None
    created_at: datetime
    items: list[POSTransactionItemRead] = []

    model_config = {"from_attributes": True}


class POSStockAdjustment(BaseModel):
    product_id: str
    quantity: int
    notes: str | None = None


class POSReturnItem(BaseModel):
    transaction_item_id: str
    product_id: str
    variant_id: str | None = None
    quantity: int = Field(..., gt=0)
    refund_amount: Decimal = Field(..., gt=0)


class POSReturnRequest(BaseModel):
    transaction_id: str
    items: list[POSReturnItem]
    refund_method: str = Field(..., pattern="^(cash|upi|card|other)$")
    reason: str | None = None


class POSReturnRead(BaseModel):
    id: UUID | str
    company_id: UUID | str
    transaction_id: UUID | str
    reason: str | None = None
    refund_amount: Decimal
    refund_method: str
    created_by_id: UUID | str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class POSDashboardData(BaseModel):
    today_sales: dict
    inventory: dict
    low_stock_products: list[dict]
    top_products: list[dict]
    payment_breakdown: list[dict]
    recent_transactions: list[dict]
