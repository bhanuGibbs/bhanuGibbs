from __future__ import annotations

import uuid
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pos_stock_movement import POSStockMovement
from app.models.pos_product import POSProduct
from app.models.pos_product_variant import POSProductVariant


class POSInventoryRepository:
    """Repository for POS inventory data access."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_low_stock_products(self, company_id: str) -> list[POSProduct]:
        """Get products where stock is at or below the low-stock threshold."""
        result = await self.session.execute(
            select(POSProduct).where(
                and_(
                    POSProduct.company_id == uuid.UUID(company_id),
                    POSProduct.is_active == True,
                    POSProduct.stock_quantity <= POSProduct.low_stock_threshold,
                )
            )
        )
        return list(result.scalars().all())

    async def get_low_stock_variants(self, company_id: str) -> list[POSProductVariant]:
        """Get variants where stock is at or below the low-stock threshold."""
        result = await self.session.execute(
            select(POSProductVariant).where(
                and_(
                    POSProductVariant.company_id == uuid.UUID(company_id),
                    POSProductVariant.is_active == True,
                    POSProductVariant.stock_quantity <= POSProductVariant.low_stock_threshold,
                )
            )
        )
        return list(result.scalars().all())

    async def add_movement(self, movement: POSStockMovement) -> POSStockMovement:
        """Add a stock movement record."""
        self.session.add(movement)
        await self.session.flush()
        return movement

    async def list_movements(
        self, company_id: str, product_id: str | None = None, limit: int = 50
    ) -> list[POSStockMovement]:
        """List stock movements for a company."""
        statement = select(POSStockMovement).where(POSStockMovement.company_id == uuid.UUID(company_id))
        if product_id:
            statement = statement.where(POSStockMovement.product_id == uuid.UUID(product_id))
        statement = statement.order_by(POSStockMovement.created_at.desc()).limit(limit)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_inventory_summary(self, company_id: str) -> dict:
        """Get inventory summary for a company."""
        products = await self.list_by_company(company_id)
        total_products = len(products)
        total_stock = sum(p.stock_quantity for p in products)
        low_stock_count = sum(1 for p in products if p.stock_quantity <= p.low_stock_threshold)
        out_of_stock = sum(1 for p in products if p.stock_quantity == 0)
        return {
            "total_products": total_products,
            "total_stock": total_stock,
            "low_stock_count": low_stock_count,
            "out_of_stock": out_of_stock,
        }

    async def list_by_company(self, company_id: str) -> list[POSProduct]:
        """List all products for inventory tracking."""
        result = await self.session.execute(
            select(POSProduct).where(POSProduct.company_id == uuid.UUID(company_id))
        )
        return list(result.scalars().all())

    async def commit(self) -> None:
        """Commit the session."""
        await self.session.commit()
