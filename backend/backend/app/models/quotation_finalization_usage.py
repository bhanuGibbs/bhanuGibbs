from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class QuotationFinalizationUsage(BaseModel):
    """Immutable usage record for a user's finalized quotation."""

    __tablename__ = "quotation_finalization_usage"
    __table_args__ = (
        UniqueConstraint("quotation_id", name="uq_quotation_finalization_usage_quotation"),
        Index("ix_quotation_finalization_usage_user_date", "user_id", "finalized_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    quotation_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    finalized_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
