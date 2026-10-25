from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class QuotationDailySequence(BaseModel):
    """Atomic quotation numbering sequence for a company and issue date."""

    __tablename__ = "quotation_daily_sequences"
    __table_args__ = (
        UniqueConstraint("company_id", "sequence_date", name="uq_quotation_daily_sequences_company_date"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False)
    sequence_date: Mapped[date] = mapped_column(Date, nullable=False)
    last_number: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
