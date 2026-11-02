from __future__ import annotations

from decimal import Decimal

from sqlalchemy import String, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class POSReturn(BaseModel):
    """Model representing a return of a POS transaction."""

    __tablename__ = "pos_returns"

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    transaction_id: Mapped[str] = mapped_column(ForeignKey("pos_transactions.id"), nullable=False, index=True)
    reason: Mapped[str | None] = mapped_column(String(512), nullable=True)
    refund_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    refund_method: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
