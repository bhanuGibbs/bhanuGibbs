from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quotation_item import QuotationItem
from app.repositories.base import BaseRepository


class QuotationItemRepository(BaseRepository[QuotationItem]):
    """Repository for quotation item database operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, QuotationItem)

    async def list_by_quotation(self, quotation_id: str) -> list[QuotationItem]:
        """Return all line items for a specific quotation."""
        statement = select(QuotationItem).where(QuotationItem.quotation_id == quotation_id)
        result = await self.session.execute(statement)
        return result.scalars().all()
