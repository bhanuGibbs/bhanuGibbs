from __future__ import annotations

from decimal import Decimal

from sqlalchemy import String, Boolean, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class POSProductVariant(BaseModel):
    """Model representing a variant of a POS product (e.g., Size: L, Color: Red)."""

    __tablename__ = "pos_product_variants"

    product_id: Mapped[str] = mapped_column(ForeignKey("pos_products.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True)
    barcode: Mapped[str | None] = mapped_column(String(100), nullable=True)
    selling_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
