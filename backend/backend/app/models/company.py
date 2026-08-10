from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Company(BaseModel):
    """Model representing a company within the quotation system."""

    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gstin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(10), nullable=True, default="INR")
    default_terms: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    quotation_prefix: Mapped[str | None] = mapped_column(String(50), nullable=False, default="QT")
    default_validity_days: Mapped[int | None] = mapped_column(nullable=True, default=30)
    logo_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    signature_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
