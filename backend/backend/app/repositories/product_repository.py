from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    """Repository for product-related database operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Product)

    async def get_by_sku(self, sku: str, company_id: str | None = None) -> Product | None:
        """Return a product by SKU, optionally scoped to a company."""
        statement = select(Product).where(Product.sku == sku)
        if company_id:
            statement = statement.where(Product.company_id == UUID(company_id))
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_by_name_and_company(self, name: str, company_id: str) -> Product | None:
        """Return a product by name within a company."""
        statement = select(Product).where(Product.name == name, Product.company_id == UUID(company_id))
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def list_by_company(self, company_id: str) -> list[Product]:
        """Return all products for a specific company."""
        statement = select(Product).where(Product.company_id == UUID(company_id)).order_by(Product.created_at.desc())
        result = await self.session.execute(statement)
        return result.scalars().all()
