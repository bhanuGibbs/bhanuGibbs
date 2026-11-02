from __future__ import annotations

import random
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pos_product import POSProduct
from app.models.pos_product_variant import POSProductVariant


class POSProductRepository:
    """Repository for POS product data access."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, product_id: str) -> POSProduct | None:
        """Get a product by ID."""
        result = await self.session.execute(
            select(POSProduct).where(POSProduct.id == product_id)
        )
        return result.scalar_one_or_none()

    async def get_by_barcode(self, company_id: str, barcode: str) -> POSProduct | None:
        """Get a product by barcode within a company."""
        result = await self.session.execute(
            select(POSProduct).where(
                and_(POSProduct.company_id == company_id, POSProduct.barcode == barcode)
            )
        )
        return result.scalar_one_or_none()

    async def get_by_sku(self, company_id: str, sku: str) -> POSProduct | None:
        """Get a product by SKU within a company."""
        result = await self.session.execute(
            select(POSProduct).where(
                and_(POSProduct.company_id == company_id, POSProduct.sku == sku)
            )
        )
        return result.scalar_one_or_none()

    async def list_by_company(
        self, company_id: str, category_id: str | None = None, search: str | None = None, active_only: bool = True
    ) -> list[POSProduct]:
        """List products for a company with optional filters."""
        statement = select(POSProduct).where(POSProduct.company_id == company_id)
        if active_only:
            statement = statement.where(POSProduct.is_active == True)
        if category_id:
            statement = statement.where(POSProduct.category_id == category_id)
        if search:
            search_pattern = f"%{search}%"
            statement = statement.where(
                POSProduct.name.ilike(search_pattern) | POSProduct.sku.ilike(search_pattern)
            )
        result = await self.session.execute(statement.order_by(POSProduct.name))
        return list(result.scalars().all())

    async def add(self, product: POSProduct) -> POSProduct:
        """Add a new product."""
        self.session.add(product)
        await self.session.flush()
        return product

    async def update(self, product: POSProduct) -> POSProduct:
        """Update an existing product."""
        await self.session.flush()
        return product

    async def delete(self, product: POSProduct) -> None:
        """Delete a product."""
        await self.session.delete(product)
        await self.session.flush()

    async def get_variants(self, product_id: str) -> list[POSProductVariant]:
        """Get all variants for a product."""
        result = await self.session.execute(
            select(POSProductVariant).where(POSProductVariant.product_id == product_id)
        )
        return list(result.scalars().all())

    async def add_variant(self, variant: POSProductVariant) -> POSProductVariant:
        """Add a new variant."""
        self.session.add(variant)
        await self.session.flush()
        return variant

    async def delete_variant(self, variant: POSProductVariant) -> None:
        """Delete a variant."""
        await self.session.delete(variant)
        await self.session.flush()

    async def commit(self) -> None:
        """Commit the session."""
        await self.session.commit()

    async def generate_barcode(self) -> str:
        """Generate a unique 12-digit barcode."""
        return f"BC{random.randint(1000000000, 9999999999)}"
