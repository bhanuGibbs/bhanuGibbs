from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.challan_product import ChallanProduct
from app.repositories.base import BaseRepository


class ChallanProductRepository(BaseRepository[ChallanProduct]):
    """Repository for challan product-related database operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, ChallanProduct)

    async def list_by_company(self, company_id: str, user_id: str) -> list[ChallanProduct]:
        """Return all challan products within a company (shared across users)."""
        statement = select(ChallanProduct).where(
            ChallanProduct.company_id == UUID(company_id)
        ).order_by(ChallanProduct.created_at.desc())
        result = await self.session.execute(statement)
        return result.scalars().all()

    async def search(self, company_id: str, query: str) -> list[ChallanProduct]:
        """Search challan products by crop, variety, or lot no for autocomplete."""
        search_pattern = f"%{query}%"
        statement = select(ChallanProduct).where(
            ChallanProduct.company_id == UUID(company_id),
            (
                ChallanProduct.crop.ilike(search_pattern)
                | ChallanProduct.variety.ilike(search_pattern)
                | ChallanProduct.lot_no.ilike(search_pattern)
            )
        ).order_by(ChallanProduct.created_at.desc()).limit(20)
        result = await self.session.execute(statement)
        return result.scalars().all()
