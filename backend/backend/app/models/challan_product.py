from __future__ import annotations

import uuid
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ChallanProduct(BaseModel):
    """Model representing a product specific to Delivery Challans with agriculture fields."""

    __tablename__ = "challan_products"

    company_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    crop: Mapped[str] = mapped_column(String(255), nullable=False)
    variety: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seed_class: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lot_no: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unit_size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit_per_sack_box: Mapped[int | None] = mapped_column(nullable=True)
    sack_box: Mapped[int | None] = mapped_column(nullable=True)
    value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")

    company = relationship("Company", backref="challan_products")
    created_by = relationship("User", backref="challan_products")
