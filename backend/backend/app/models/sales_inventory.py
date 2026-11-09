from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class SalesInventoryDealer(BaseModel):
    __tablename__ = "sales_inventory_dealers"
    __table_args__ = (
        UniqueConstraint("company_id", "dealer_code", name="uq_si_dealer_company_code"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    dealer_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    gstin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    territory: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)


class SalesInventoryProduct(BaseModel):
    __tablename__ = "sales_inventory_products"
    __table_args__ = (
        UniqueConstraint("company_id", "product_code", name="uq_si_product_company_code"),
        CheckConstraint("unit_price >= 0", name="ck_si_product_price_nonnegative"),
        CheckConstraint("reorder_level >= 0", name="ck_si_product_reorder_nonnegative"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    product_code: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    unit: Mapped[str] = mapped_column(String(50), nullable=False, default="unit")
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    reorder_level: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False, default=Decimal("0"))
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)


class SalesInventoryOrder(BaseModel):
    __tablename__ = "sales_inventory_orders"
    __table_args__ = (
        UniqueConstraint("company_id", "order_number", name="uq_si_order_company_number"),
        CheckConstraint(
            "status IN ('Draft', 'Pending Approval', 'Approved', 'Rejected', 'Processing', 'Dispatched', 'Delivered', 'Cancelled')",
            name="ck_si_order_status",
        ),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    dealer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sales_inventory_dealers.id"), nullable=False)
    sales_rep_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    order_number: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Draft")
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SalesInventoryOrderItem(BaseModel):
    __tablename__ = "sales_inventory_order_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_si_order_item_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="ck_si_order_item_price_nonnegative"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sales_inventory_orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sales_inventory_products.id"), nullable=False)
    product_code: Mapped[str] = mapped_column(String(100), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)


class SalesInventoryOrderHistory(BaseModel):
    __tablename__ = "sales_inventory_order_history"

    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sales_inventory_orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    actor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    from_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)


class SalesInventoryInvoice(BaseModel):
    __tablename__ = "sales_inventory_invoices"
    __table_args__ = (
        UniqueConstraint("company_id", "invoice_number", name="uq_si_invoice_company_number"),
        UniqueConstraint("order_id", name="uq_si_invoice_order"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sales_inventory_orders.id"), nullable=False)
    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)


class SalesInventoryStock(BaseModel):
    __tablename__ = "sales_inventory_stock"
    __table_args__ = (
        UniqueConstraint("company_id", "product_id", name="uq_si_stock_company_product"),
        CheckConstraint("quantity >= 0", name="ck_si_stock_quantity_nonnegative"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sales_inventory_products.id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False, default=Decimal("0"))


class SalesInventoryTransaction(BaseModel):
    __tablename__ = "sales_inventory_transactions"
    __table_args__ = (
        CheckConstraint(
            "transaction_type IN ('Purchase', 'Order Approval', 'Manual Adjustment', 'Return')",
            name="ck_si_transaction_type",
        ),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sales_inventory_products.id"), nullable=False, index=True)
    order_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sales_inventory_orders.id"), nullable=True)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    transaction_type: Mapped[str] = mapped_column(String(30), nullable=False)
    quantity_delta: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    balance_after: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)


class SalesInventoryNotification(BaseModel):
    __tablename__ = "sales_inventory_notifications"

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    resource_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)
