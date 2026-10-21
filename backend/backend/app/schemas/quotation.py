from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, PositiveInt, constr


class QuotationCustomerInfo(BaseModel):
    """Customer details for free-form quotation submission."""

    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=512)
    company_name: str | None = Field(default=None, max_length=255)
    gstin: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, max_length=20)


class QuotationSubmitItem(BaseModel):
    """Line item details for free-form quotation submission."""

    product_id: UUID | None = None
    product_name: str | None = None
    sku: str | None = None
    hsn_code: str | None = None
    description: str | None = None
    unit: str | None = None
    quantity: PositiveInt = Field(..., ge=1)
    unit_price: Decimal = Field(..., gt=0)
    discount: Decimal = Field(default=Decimal('0.00'), ge=0, le=100)
    gst: Decimal = Field(default=Decimal('0.00'), ge=0, le=100)


class QuotationSubmit(BaseModel):
    """Payload for submitting a new quotation with customer/product names."""

    quotation_id: str | None = None
    reference_number: constr(min_length=1, max_length=100) | None = None
    title: constr(min_length=1, max_length=255)
    description: str | None = None
    issued_at: datetime
    valid_until: datetime | None = None
    terms: str | None = None
    notes: str | None = None
    currency: str | None = None
    shipping_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    customer: QuotationCustomerInfo
    items: list[QuotationSubmitItem]


class QuotationItemBase(BaseModel):
    """Shared fields for quotation line items."""

    product_id: str | None = None
    product_name: str | None = None
    item_name: str | None = None
    description: str | None = None
    unit: str | None = None
    quantity: PositiveInt = Field(..., ge=1)
    unit_price: Decimal = Field(..., gt=0)
    discount: Decimal = Field(default=Decimal('0.00'), ge=0, le=100)
    gst: Decimal = Field(default=Decimal('0.00'), ge=0, le=100)


class QuotationItemCreate(QuotationItemBase):
    """Fields required to create a quotation line item."""


class QuotationItemRead(QuotationItemBase):
    """Fields returned in quotation item read responses."""

    id: UUID
    product_id: UUID | None = None
    total_price: Decimal
    amount: Decimal
    tax_amount: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class QuotationBase(BaseModel):
    """Shared quotation schema fields."""

    quotation_id: str | None = None
    reference_number: constr(min_length=1, max_length=100) | None = None
    title: constr(min_length=1, max_length=255)
    description: str | None = None
    issued_at: datetime
    valid_until: datetime | None = None
    terms: str | None = None
    notes: str | None = None
    currency: str | None = None
    shipping_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    items: list[QuotationItemCreate]


class QuotationCreate(QuotationBase):
    """Properties required to create a quotation."""

    customer_id: str
    company_id: str


class QuotationUpdate(BaseModel):
    """Properties for updating a quotation."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    issued_at: datetime | None = None
    valid_until: datetime | None = None
    items: list[QuotationItemCreate] | None = None
    status: str | None = None
    notes: str | None = None
    terms: str | None = None
    currency: str | None = None
    shipping_amount: Decimal | None = Field(default=None, ge=0)
    customer: QuotationCustomerInfo | None = None


class QuotationRead(QuotationBase):
    id: UUID
    customer_id: UUID
    company_id: UUID
    """Properties returned in quotation responses."""

    quotation_number: str | None = None
    reference_number: constr(min_length=1, max_length=100)
    status: str
    subtotal: Decimal
    discount: Decimal
    tax_amount: Decimal
    shipping_amount: Decimal
    total_amount: Decimal
    valid_until: datetime | None = None
    created_at: datetime
    updated_at: datetime
    company_name: str | None = None
    company_address: str | None = None
    company_phone_number: str | None = None
    company_email: str | None = None
    company_website: str | None = None
    company_gstin: str | None = None
    company_logo_path: str | None = None
    company_signature_path: str | None = None
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone_number: str | None = None
    customer_address: str | None = None
    customer_gstin: str | None = None
    items: list[QuotationItemRead]

    model_config = {
        "from_attributes": True,
    }
