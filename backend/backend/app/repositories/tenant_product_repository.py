from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant_product import TenantProduct


class TenantProductRepository:
    """Repository for tenant product data access."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, product_id: str) -> TenantProduct | None:
        """Get a tenant product by ID."""
        result = await self.session.execute(
            select(TenantProduct).where(TenantProduct.id == uuid.UUID(product_id))
        )
        return result.scalar_one_or_none()

    async def get_by_company_and_master(
        self, company_id: str, master_product_id: str
    ) -> TenantProduct | None:
        """Get a tenant product by company and master product ID."""
        result = await self.session.execute(
            select(TenantProduct).where(
                and_(
                    TenantProduct.company_id == uuid.UUID(company_id),
                    TenantProduct.master_product_id == uuid.UUID(master_product_id),
                )
            )
        )
        return result.scalar_one_or_none()

    async def list_by_company(
        self, company_id: str, skip: int = 0, limit: int = 50
    ) -> tuple[Sequence[TenantProduct], int]:
        """List all tenant products for a company with pagination.

        Returns a tuple of (products, total_count).
        """
        company_uuid = uuid.UUID(company_id)
        statement = select(TenantProduct).where(TenantProduct.company_id == company_uuid)
        count_statement = select(func.count()).select_from(TenantProduct).where(
            TenantProduct.company_id == company_uuid
        )

        count_result = await self.session.execute(count_statement)
        total = count_result.scalar_one()

        statement = statement.order_by(TenantProduct.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(statement)
        products = list(result.scalars().all())

        return products, total

    async def add(self, product: TenantProduct) -> TenantProduct:
        """Add a new tenant product."""
        self.session.add(product)
        await self.session.flush()
        await self.session.refresh(product)
        return product

    async def update(self, product: TenantProduct) -> TenantProduct:
        """Update an existing tenant product."""
        await self.session.flush()
        await self.session.refresh(product)
        return product

    async def delete(self, product: TenantProduct) -> None:
        """Delete a tenant product."""
        await self.session.delete(product)
        await self.session.flush()

    async def commit(self) -> None:
        """Commit the session."""
        await self.session.commit()
