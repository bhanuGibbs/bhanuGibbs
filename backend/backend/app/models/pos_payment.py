from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, ForeignKey, Numeric, func
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class POSPayment(Base):
    """Model representing a payment for a POS transaction."""

    __tablename__ = "pos_payments"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
    )

    transaction_id: Mapped[str] = mapped_column(ForeignKey("pos_transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
