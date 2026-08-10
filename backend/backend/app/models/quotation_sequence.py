from __future__ import annotations

import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.company import Company


class QuotationSequence(BaseModel):
    """Model representing a yearly quotation sequence for a company."""

    __tablename__ = "quotation_sequences"

    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    prefix: Mapped[str] = mapped_column(String(50), nullable=False, default="QT")
    next_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    company: Mapped[Company] = relationship("Company", backref="quotation_sequences")
