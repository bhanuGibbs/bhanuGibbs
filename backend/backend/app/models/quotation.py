from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.user import User


class Quotation(BaseModel):
    """Model representing a quotation document."""

    __tablename__ = "quotations"
    __table_args__ = (
        UniqueConstraint("company_id", "quotation_number", name="uq_quotations_company_quotation_number"),
    )

    reference_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    quotation_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    quotation_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id"), nullable=False)
    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    discount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    shipping_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Draft")
    valid_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    terms: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    company_phone_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    company_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_gstin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    company_logo_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    company_signature_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_phone_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    customer_address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    customer_gstin: Mapped[str | None] = mapped_column(String(20), nullable=True)

    customer = relationship("Customer", backref="quotations")
    company = relationship("Company", backref="quotations")
    created_by = relationship("User", backref="quotations")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan", lazy="selectin")
