from __future__ import annotations

from decimal import Decimal

from sqlalchemy import String, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class POSTransaction(BaseModel):
    """Model representing a POS transaction (checkout)."""

    __tablename__ = "pos_transactions"

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    transaction_number: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    grand_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    payment_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="completed")
    notes: Mapped[str | None] = mapped_column(String(512), nullable=True)

    __table_args__ = (
        # Unique transaction number per company
        {"sqlite_autoincrement": True},
    )
