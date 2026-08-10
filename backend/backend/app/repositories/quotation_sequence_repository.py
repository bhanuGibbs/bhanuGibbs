from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quotation_sequence import QuotationSequence
from app.repositories.base import BaseRepository


class QuotationSequenceRepository(BaseRepository[QuotationSequence]):
    """Repository for company quotation sequences."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, QuotationSequence)

    async def get_by_company_and_year(self, company_id: str, year: int) -> QuotationSequence | None:
        statement = select(QuotationSequence).where(
            QuotationSequence.company_id == UUID(company_id),
            QuotationSequence.year == year,
        )
        result = await self.session.execute(statement)
        return result.scalars().first()
