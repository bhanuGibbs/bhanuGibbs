from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.master_product import MasterProduct


class MasterProductRepository:
    """Repository for master product data access."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, product_id: str) -> MasterProduct | None:
        """Get a master product by ID."""
        result = await self.session.execute(
            select(MasterProduct).where(MasterProduct.id == uuid.UUID(product_id))
        )
        return result.scalar_one_or_none()

    async def get_by_sku(self, sku: str) -> MasterProduct | None:
        """Get a master product by SKU (global uniqueness)."""
        result = await self.session.execute(
            select(MasterProduct).where(MasterProduct.sku == sku)
        )
        return result.scalar_one_or_none()

    async def search(
        self,
        query: str | None = None,
        business_type: str | None = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[Sequence[MasterProduct], int]:
        """Search master products with filtering and pagination.

        Returns a tuple of (products, total_count).
        """
        statement = select(MasterProduct)
        count_statement = select(func.count()).select_from(MasterProduct)

        conditions = []
        if active_only:
            conditions.append(MasterProduct.is_active == True)
        if business_type:
            conditions.append(MasterProduct.business_type == business_type)
        if query:
            search_pattern = f"%{query}%"
            conditions.append(
                MasterProduct.product_name.ilike(search_pattern)
                | MasterProduct.sku.ilike(search_pattern)
                | MasterProduct.barcode.ilike(search_pattern)
            )

        if conditions:
            statement = statement.where(and_(*conditions))
            count_statement = count_statement.where(and_(*conditions))

        # Get total count
        count_result = await self.session.execute(count_statement)
        total = count_result.scalar_one()

        # Get paginated results
        statement = statement.order_by(MasterProduct.product_name).offset(skip).limit(limit)
        result = await self.session.execute(statement)
        products = list(result.scalars().all())

        return products, total

    async def list_by_business_type(
        self, business_type: str, active_only: bool = True, skip: int = 0, limit: int = 50
    ) -> tuple[Sequence[MasterProduct], int]:
        """List master products for a specific business type."""
        return await self.search(
            business_type=business_type,
            active_only=active_only,
            skip=skip,
            limit=limit,
        )

    async def add(self, product: MasterProduct) -> MasterProduct:
        """Add a new master product."""
        self.session.add(product)
        await self.session.flush()
        return product

    async def update(self, product: MasterProduct) -> MasterProduct:
        """Update an existing master product."""
        await self.session.flush()
        return product

    async def delete(self, product: MasterProduct) -> None:
        """Delete a master product."""
        await self.session.delete(product)
        await self.session.flush()

    async def deactivate(self, product: MasterProduct) -> MasterProduct:
        """Deactivate a master product (soft delete)."""
        product.is_active = False
        await self.session.flush()
        return product

    async def commit(self) -> None:
        """Commit the session."""
        await self.session.commit()
