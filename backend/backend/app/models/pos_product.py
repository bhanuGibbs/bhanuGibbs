from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy import String, Text, Boolean, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class POSProduct(BaseModel):
    """Model representing a POS product."""

    __tablename__ = "pos_products"

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    category_id: Mapped[str | None] = mapped_column(ForeignKey("pos_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    barcode: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    purchase_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    selling_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    image_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    __table_args__ = (
        # Unique barcode per company
        {"sqlite_autoincrement": True},
    )
