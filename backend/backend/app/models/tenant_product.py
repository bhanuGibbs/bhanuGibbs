from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class TenantProduct(BaseModel):
    """Model representing a tenant-specific product imported from the central repository.

    Each tenant (company) maintains their own selling price and stock quantity
    for products imported from master products. Custom products have no master_product_id.
    """

    __tablename__ = "tenant_products"

    company_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True
    )
    master_product_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("master_products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    selling_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    stock_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=5)

    __table_args__ = (
        # A tenant can only import a master product once
        UniqueConstraint("company_id", "master_product_id", name="uq_tenant_company_master_product"),
    )
