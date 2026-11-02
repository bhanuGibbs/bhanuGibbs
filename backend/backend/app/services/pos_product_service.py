from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pos_product import POSProduct
from app.models.pos_product_variant import POSProductVariant
from app.repositories.pos_product_repository import POSProductRepository
from app.services.exceptions import ConflictError, NotFoundError


class POSProductService:
    """Service layer for POS product business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = POSProductRepository(session)

    async def create_product(
        self,
        company_id: str,
        name: str,
        sku: str,
        barcode: str | None,
        selling_price: Decimal,
        unit: str,
        category_id: str | None = None,
        description: str | None = None,
        purchase_price: Decimal = Decimal("0"),
        stock_quantity: int = 0,
        low_stock_threshold: int = 5,
        created_by_id: str | None = None,
    ) -> POSProduct:
        """Create a new product."""
        existing = await self.repository.get_by_sku(company_id, sku)
        if existing:
            raise ConflictError("Product with this SKU already exists.")
        # Auto-generate barcode if not provided
        if not barcode:
            barcode = await self.repository.generate_barcode()
        existing_barcode = await self.repository.get_by_barcode(company_id, barcode)
        if existing_barcode:
            raise ConflictError("Product with this barcode already exists.")

        product = POSProduct(
            company_id=company_id,
            category_id=category_id,
            name=name,
            sku=sku,
            barcode=barcode,
            description=description,
            purchase_price=purchase_price,
            selling_price=selling_price,
            unit=unit,
            stock_quantity=stock_quantity,
            low_stock_threshold=low_stock_threshold,
            created_by_id=created_by_id,
        )
        return await self.repository.add(product)

    async def get_product(self, product_id: str, company_id: str) -> POSProduct:
        """Get a product by ID, verifying company ownership."""
        product = await self.repository.get(product_id)
        if not product or str(product.company_id) != company_id:
            raise NotFoundError("Product not found.")
        return product

    async def list_products(
        self, company_id: str, category_id: str | None = None, search: str | None = None, active_only: bool = True
    ) -> list[POSProduct]:
        """List products for a company."""
        return await self.repository.list_by_company(company_id, category_id, search, active_only)

    async def get_by_barcode(self, company_id: str, barcode: str) -> POSProduct | None:
        """Lookup product by barcode."""
        return await self.repository.get_by_barcode(company_id, barcode)

    async def update_product(
        self,
        product_id: str,
        company_id: str,
        name: str | None = None,
        sku: str | None = None,
        barcode: str | None = None,
        selling_price: Decimal | None = None,
        unit: str | None = None,
        category_id: str | None | bool = None,
        description: str | None = None,
        purchase_price: Decimal | None = None,
        stock_quantity: int | None = None,
        low_stock_threshold: int | None = None,
        is_active: bool | None = None,
    ) -> POSProduct:
        """Update a product."""
        product = await self.get_product(product_id, company_id)
        if name is not None:
            product.name = name
        if sku is not None:
            existing = await self.repository.get_by_sku(company_id, sku)
            if existing and str(existing.id) != product_id:
                raise ConflictError("Product with this SKU already exists.")
            product.sku = sku
        if barcode is not None:
            existing = await self.repository.get_by_barcode(company_id, barcode)
            if existing and str(existing.id) != product_id:
                raise ConflictError("Product with this barcode already exists.")
            product.barcode = barcode
        if selling_price is not None:
            product.selling_price = selling_price
        if unit is not None:
            product.unit = unit
        if category_id is not None:
            product.category_id = category_id
        if description is not None:
            product.description = description
        if purchase_price is not None:
            product.purchase_price = purchase_price
        if stock_quantity is not None:
            product.stock_quantity = stock_quantity
        if low_stock_threshold is not None:
            product.low_stock_threshold = low_stock_threshold
        if is_active is not None:
            product.is_active = is_active
        return await self.repository.update(product)

    async def delete_product(self, product_id: str, company_id: str) -> None:
        """Delete a product."""
        product = await self.get_product(product_id, company_id)
        await self.repository.delete(product)
        await self.repository.commit()

    async def generate_barcode(self, product_id: str, company_id: str) -> str:
        """Generate a unique barcode for a product."""
        product = await self.get_product(product_id, company_id)
        while True:
            barcode = str(uuid.uuid4())[:12].upper()
            existing = await self.repository.get_by_barcode(company_id, barcode)
            if not existing:
                product.barcode = barcode
                await self.repository.update(product)
                await self.repository.commit()
                return barcode

    async def create_variant(
        self,
        product_id: str,
        company_id: str,
        name: str,
        selling_price: Decimal | None = None,
        stock_quantity: int = 0,
        low_stock_threshold: int = 5,
        sku: str | None = None,
        barcode: str | None = None,
    ) -> POSProductVariant:
        """Create a variant for a product."""
        await self.get_product(product_id, company_id)
        variant = POSProductVariant(
            product_id=product_id,
            company_id=company_id,
            name=name,
            sku=sku,
            barcode=barcode,
            selling_price=selling_price,
            stock_quantity=stock_quantity,
            low_stock_threshold=low_stock_threshold,
        )
        return await self.repository.add_variant(variant)

    async def update_variant(
        self, variant_id: str, product_id: str, company_id: str,
        name: str | None = None, selling_price: Decimal | None = None,
        stock_quantity: int | None = None, low_stock_threshold: int | None = None,
        is_active: bool | None = None,
    ) -> POSProductVariant:
        """Update a variant."""
        product = await self.get_product(product_id, company_id)
        variants = await self.repository.get_variants(product_id)
        variant = next((v for v in variants if str(v.id) == variant_id), None)
        if not variant:
            raise NotFoundError("Variant not found.")
        if name is not None:
            variant.name = name
        if selling_price is not None:
            variant.selling_price = selling_price
        if stock_quantity is not None:
            variant.stock_quantity = stock_quantity
        if low_stock_threshold is not None:
            variant.low_stock_threshold = low_stock_threshold
        if is_active is not None:
            variant.is_active = is_active
        await self.repository.session.flush()
        return variant

    async def delete_variant(self, variant_id: str, product_id: str, company_id: str) -> None:
        """Delete a variant."""
        product = await self.get_product(product_id, company_id)
        variants = await self.repository.get_variants(product_id)
        variant = next((v for v in variants if str(v.id) == variant_id), None)
        if not variant:
            raise NotFoundError("Variant not found.")
        await self.repository.delete_variant(variant)
        await self.repository.commit()

    async def get_variants(self, product_id: str, company_id: str) -> list[POSProductVariant]:
        """Get variants for a product."""
        await self.get_product(product_id, company_id)
        return await self.repository.get_variants(product_id)

    async def save(self) -> None:
        """Commit pending changes."""
        await self.repository.commit()
