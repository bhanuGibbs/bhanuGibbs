from __future__ import annotations

from decimal import Decimal

from sqlalchemy import String, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class POSTransactionItem(BaseModel):
    """Model representing an item in a POS transaction."""

    __tablename__ = "pos_transaction_items"

    transaction_id: Mapped[str] = mapped_column(ForeignKey("pos_transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("pos_products.id"), nullable=False, index=True)
    variant_id: Mapped[str | None] = mapped_column(ForeignKey("pos_product_variants.id"), nullable=True, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    barcode: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
