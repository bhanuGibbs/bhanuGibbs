from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.services.exceptions import ConflictError, NotFoundError


class ProductService:
    """Service layer for product business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = ProductRepository(session)

    async def create_product(
        self,
        name: str,
        price: Decimal,
        description: str | None = None,
        sku: str | None = None,
        gst_percentage: Decimal | None = None,
        unit: str | None = None,
        hsn_code: str | None = None,
        company_id: str | None = None,
        created_by_id: str | None = None,
    ) -> Product:
        """Create a new product within a company."""
        if sku:
            existing = await self.repository.get_by_sku(sku)
            if existing:
                raise ConflictError("Product with this SKU already exists.")

        product = Product(
            name=name, price=price, description=description, sku=sku,
            gst_percentage=gst_percentage, unit=unit, hsn_code=hsn_code,
            company_id=UUID(company_id) if company_id else None,
            created_by_id=UUID(created_by_id) if created_by_id else None,
        )
        await self.repository.add(product)
        await self.repository.commit()
        return product

    async def list_products(self, company_id: str, user_id: str) -> list[Product]:
        """List products for the authenticated user within a company."""
        return await self.repository.list_by_company(company_id, user_id)

    async def get_product(self, product_id: str) -> Product | None:
        """Retrieve a product by UUID."""
        return await self.repository.get(product_id)

    async def update_product(
        self,
        product_id: str,
        name: str | None = None,
        description: str | None = None,
        price: Decimal | None = None,
        sku: str | None = None,
        gst_percentage: Decimal | None = None,
        unit: str | None = None,
        hsn_code: str | None = None,
    ) -> Product:
        """Update an existing product."""
        product = await self.repository.get(product_id)
        if not product:
            raise NotFoundError("Product not found.")

        if name is not None:
            product.name = name
        if description is not None:
            product.description = description
        if price is not None:
            product.price = price
        if sku is not None:
            product.sku = sku
        if gst_percentage is not None:
            product.gst_percentage = gst_percentage
        if unit is not None:
            product.unit = unit
        if hsn_code is not None:
            product.hsn_code = hsn_code

        await self.repository.commit()
        return product

    async def delete_product(self, product_id: str) -> None:
        """Delete a product."""
        product = await self.repository.get(product_id)
        if not product:
            raise NotFoundError("Product not found.")

        await self.repository.delete(product)
        await self.repository.commit()
