from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pos_stock_movement import POSStockMovement
from app.models.pos_product import POSProduct
from app.models.tenant_product import TenantProduct
from app.repositories.pos_inventory_repository import POSInventoryRepository
from app.repositories.pos_product_repository import POSProductRepository
from app.repositories.tenant_product_repository import TenantProductRepository
from app.services.exceptions import NotFoundError, BadRequestError


class POSInventoryService:
    """Service layer for POS inventory business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.inventory_repo = POSInventoryRepository(session)
        self.product_repo = POSProductRepository(session)
        self.tenant_repo = TenantProductRepository(session)

    async def get_inventory_summary(self, company_id: str) -> dict:
        """Get inventory summary for a company."""
        return await self.inventory_repo.get_inventory_summary(company_id)

    async def get_low_stock_products(self, company_id: str) -> list[dict]:
        """Get products at or below low-stock threshold, including tenant products."""
        from app.models.master_product import MasterProduct
        from sqlalchemy import select

        pos_products = await self.inventory_repo.get_low_stock_products(company_id)
        result = []
        for p in pos_products:
            result.append({
                "id": str(p.id), "name": p.name, "sku": p.sku,
                "stock_quantity": p.stock_quantity, "low_stock_threshold": p.low_stock_threshold,
                "source": "pos_product",
            })

        # Also check tenant products
        tenant_result = await self.tenant_repo.list_by_company(company_id, skip=0, limit=200)
        tenant_products, _ = tenant_result
        for tp in tenant_products:
            if tp.stock_qty <= tp.low_stock_threshold:
                master_name = ""
                master_sku = ""
                if tp.master_product_id:
                    mp_result = await self.tenant_repo.session.execute(
                        select(MasterProduct).where(MasterProduct.id == tp.master_product_id)
                    )
                    master = mp_result.scalar_one_or_none()
                    if master:
                        master_name = master.product_name or ""
                        master_sku = master.sku or ""
                result.append({
                    "id": str(tp.id), "name": master_name, "sku": master_sku,
                    "stock_quantity": tp.stock_qty, "low_stock_threshold": tp.low_stock_threshold,
                    "source": "tenant_product",
                })
        return result

    async def adjust_stock(
        self,
        company_id: str,
        product_id: str,
        quantity: int,
        created_by_id: str,
        notes: str | None = None,
    ) -> dict:
        """Manually adjust stock for a product (pos_product or tenant_product)."""
        # Try pos_product first
        product = await self.product_repo.get(product_id)
        if product and str(product.company_id) == company_id:
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
            return {
                "id": str(product.id),
                "name": product.name,
                "sku": product.sku,
                "stock_quantity": product.stock_quantity,
                "source": "pos_product",
            }

        # Try tenant_product
        tenant_product = await self.tenant_repo.get(product_id)
        if tenant_product and tenant_product.company_id == uuid.UUID(company_id):
            tenant_product.stock_qty += quantity
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
            await self.tenant_repo.commit()

            # Fetch master product details for name/sku
            from app.models.master_product import MasterProduct
            from sqlalchemy import select
            master_name = ""
            master_sku = ""
            if tenant_product.master_product_id:
                mp_result = await self.tenant_repo.session.execute(
                    select(MasterProduct).where(MasterProduct.id == tenant_product.master_product_id)
                )
                master = mp_result.scalar_one_or_none()
                if master:
                    master_name = master.product_name or ""
                    master_sku = master.sku or ""

            return {
                "id": str(tenant_product.id),
                "name": master_name,
                "sku": master_sku,
                "stock_quantity": tenant_product.stock_qty,
                "source": "tenant_product",
            }

        raise NotFoundError("Product not found.")

    async def get_stock_movements(
        self, company_id: str, product_id: str | None = None, limit: int = 50
    ) -> list[POSStockMovement]:
        """Get stock movement history."""
        return await self.inventory_repo.list_movements(company_id, product_id, limit)

    async def save(self) -> None:
        """Commit pending changes."""
        await self.inventory_repo.commit()
