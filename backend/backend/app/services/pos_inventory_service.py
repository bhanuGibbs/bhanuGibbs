from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pos_stock_movement import POSStockMovement
from app.models.pos_product import POSProduct
from app.repositories.pos_inventory_repository import POSInventoryRepository
from app.repositories.pos_product_repository import POSProductRepository
from app.services.exceptions import NotFoundError, BadRequestError


class POSInventoryService:
    """Service layer for POS inventory business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.inventory_repo = POSInventoryRepository(session)
        self.product_repo = POSProductRepository(session)

    async def get_inventory_summary(self, company_id: str) -> dict:
        """Get inventory summary for a company."""
        return await self.inventory_repo.get_inventory_summary(company_id)

    async def get_low_stock_products(self, company_id: str) -> list[POSProduct]:
        """Get products at or below low-stock threshold."""
        return await self.inventory_repo.get_low_stock_products(company_id)

    async def adjust_stock(
        self,
        company_id: str,
        product_id: str,
        quantity: int,
        created_by_id: str,
        notes: str | None = None,
    ) -> POSProduct:
        """Manually adjust stock for a product."""
        product = await self.product_repo.get(product_id)
        if not product or str(product.company_id) != company_id:
            raise NotFoundError("Product not found.")

        product.stock_quantity += quantity
        movement_type = "in" if quantity > 0 else "adjustment"

        movement = POSStockMovement(
            company_id=company_id,
            product_id=product_id,
            movement_type=movement_type,
            quantity=quantity,
            reference_type="adjustment",
            notes=notes or f"Manual adjustment: {'+' if quantity > 0 else ''}{quantity}",
            created_by_id=created_by_id,
        )
        await self.inventory_repo.add_movement(movement)
        await self.inventory_repo.commit()
        await self.inventory_repo.session.refresh(product)
        return product

    async def get_stock_movements(
        self, company_id: str, product_id: str | None = None, limit: int = 50
    ) -> list[POSStockMovement]:
        """Get stock movement history."""
        return await self.inventory_repo.list_movements(company_id, product_id, limit)

    async def save(self) -> None:
        """Commit pending changes."""
        await self.inventory_repo.commit()
