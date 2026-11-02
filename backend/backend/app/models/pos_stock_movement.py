from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, ForeignKey, Integer, func
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class POSStockMovement(Base):
    """Model tracking stock movements (in, out, adjustment, return)."""

    __tablename__ = "pos_stock_movements"

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

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    product_id: Mapped[str | None] = mapped_column(ForeignKey("pos_products.id", ondelete="SET NULL"), nullable=True, index=True)
    variant_id: Mapped[str | None] = mapped_column(ForeignKey("pos_product_variants.id", ondelete="SET NULL"), nullable=True, index=True)
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
