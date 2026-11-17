from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.master_product import MasterProduct
from app.models.tenant_product import TenantProduct
from app.repositories.tenant_product_repository import TenantProductRepository
from app.schemas.tenant_product import (
    TenantProductCreate,
    TenantProductListResult,
    TenantProductRead,
    TenantProductUpdate,
)
from app.services.exceptions import ConflictError, NotFoundError


class TenantProductService:
    """Service layer for tenant product business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = TenantProductRepository(session)

    async def import_from_master(
        self,
        company_id: str,
        data: TenantProductCreate,
    ) -> TenantProduct:
        """Import a master product as a tenant product.

        Validates that the master product exists and the tenant hasn't already imported it.
        """
        # Check if master product exists
        master_product = await self._get_master_product(data.master_product_id)
        if not master_product:
            raise NotFoundError("Master product not found.")

        # Check if tenant already imported this product
        existing = await self.repository.get_by_company_and_master(
            company_id, data.master_product_id
        )
        if existing:
            raise ConflictError("This product is already imported.")

        tenant_product = TenantProduct(
            company_id=uuid.UUID(company_id),
            master_product_id=uuid.UUID(data.master_product_id),
            selling_price=data.selling_price,
            stock_qty=data.stock_qty,
            low_stock_threshold=data.low_stock_threshold,
        )
        return await self.repository.add(tenant_product)

    async def get_product(self, product_id: str, company_id: str) -> TenantProductRead:
        """Get a tenant product by ID with master product details."""
        tenant_product = await self.repository.get(product_id)
        if not tenant_product or tenant_product.company_id != uuid.UUID(company_id):
            raise NotFoundError("Tenant product not found.")

        return await self._enrich_with_master(tenant_product)

    async def list_products(
        self,
        company_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> TenantProductListResult:
        """List all tenant products for a company with master product details."""
        products, total = await self.repository.list_by_company(
            company_id, skip=skip, limit=limit
        )

        enriched = []
        for tp in products:
            enriched_tp = await self._enrich_with_master(tp)
            enriched.append(enriched_tp)

        return TenantProductListResult(
            products=enriched,
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_product(
        self,
        product_id: str,
        company_id: str,
        data: TenantProductUpdate,
    ) -> TenantProductRead:
        """Update tenant product price and stock."""
        tenant_product = await self.repository.get(product_id)
        if not tenant_product or tenant_product.company_id != uuid.UUID(company_id):
            raise NotFoundError("Tenant product not found.")

        if data.selling_price is not None:
            tenant_product.selling_price = data.selling_price
        if data.stock_qty is not None:
            tenant_product.stock_qty = data.stock_qty
        if data.low_stock_threshold is not None:
            tenant_product.low_stock_threshold = data.low_stock_threshold

        await self.repository.update(tenant_product)
        return await self._enrich_with_master(tenant_product)

    async def delete_product(self, product_id: str, company_id: str) -> None:
        """Delete a tenant product."""
        tenant_product = await self.repository.get(product_id)
        if not tenant_product or tenant_product.company_id != uuid.UUID(company_id):
            raise NotFoundError("Tenant product not found.")

        await self.repository.delete(tenant_product)

    async def _get_master_product(self, master_product_id) -> MasterProduct | None:
        """Get a master product by ID."""
        if isinstance(master_product_id, str):
            mp_id = uuid.UUID(master_product_id)
        else:
            mp_id = master_product_id
        result = await self.repository.session.execute(
            select(MasterProduct).where(MasterProduct.id == mp_id)
        )
        return result.scalar_one_or_none()

    async def _enrich_with_master(self, tenant_product: TenantProduct) -> TenantProductRead:
        """Enrich a tenant product with master product details."""
        master = None
        if tenant_product.master_product_id:
            master = await self._get_master_product(tenant_product.master_product_id)

        return TenantProductRead(
            id=str(tenant_product.id),
            company_id=str(tenant_product.company_id),
            master_product_id=str(tenant_product.master_product_id) if tenant_product.master_product_id else None,
            selling_price=tenant_product.selling_price,
            stock_qty=tenant_product.stock_qty,
            low_stock_threshold=tenant_product.low_stock_threshold,
            created_at=tenant_product.created_at,
            updated_at=tenant_product.updated_at,
            product_name=master.product_name if master else None,
            sku=master.sku if master else None,
            barcode=master.barcode if master else None,
            category=master.category if master else None,
            unit=master.unit if master else None,
            description=master.description if master else None,
            business_type=master.business_type if master else None,
        )
