from __future__ import annotations

from decimal import Decimal

from sqlalchemy import String, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class POSReturnItem(BaseModel):
    """Model representing an item in a POS return."""

    __tablename__ = "pos_return_items"

    return_id: Mapped[str] = mapped_column(ForeignKey("pos_returns.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_item_id: Mapped[str] = mapped_column(ForeignKey("pos_transaction_items.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("pos_products.id"), nullable=False, index=True)
    variant_id: Mapped[str | None] = mapped_column(ForeignKey("pos_product_variants.id"), nullable=True, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    refund_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
