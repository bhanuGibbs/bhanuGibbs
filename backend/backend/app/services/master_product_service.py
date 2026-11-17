from __future__ import annotations

import csv
import io
import uuid
from decimal import Decimal
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.master_product import MasterProduct
from app.repositories.master_product_repository import MasterProductRepository
from app.schemas.master_product import (
    MasterProductCreate,
    MasterProductImportItem,
    MasterProductImportResult,
    MasterProductSearchResult,
    MasterProductUpdate,
    VALID_BUSINESS_TYPES,
)
from app.services.exceptions import ConflictError, NotFoundError


class MasterProductService:
    """Service layer for master product business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = MasterProductRepository(session)

    async def create_product(self, data: MasterProductCreate) -> MasterProduct:
        """Create a new master product."""
        existing = await self.repository.get_by_sku(data.sku)
        if existing:
            raise ConflictError(f"Product with SKU '{data.sku}' already exists.")

        product = MasterProduct(
            business_type=data.business_type,
            product_name=data.product_name,
            sku=data.sku,
            barcode=data.barcode,
            category=data.category,
            unit=data.unit,
            description=data.description,
        )
        return await self.repository.add(product)

    async def get_product(self, product_id: str) -> MasterProduct:
        """Get a master product by ID."""
        product = await self.repository.get(product_id)
        if not product:
            raise NotFoundError("Master product not found.")
        return product

    async def search_products(
        self,
        query: str | None = None,
        business_type: str | None = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 50,
    ) -> MasterProductSearchResult:
        """Search master products with filtering and pagination."""
        products, total = await self.repository.search(
            query=query,
            business_type=business_type,
            active_only=active_only,
            skip=skip,
            limit=limit,
        )
        return MasterProductSearchResult(
            products=[self._to_read(p) for p in products],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_product(self, product_id: str, data: MasterProductUpdate) -> MasterProduct:
        """Update an existing master product."""
        product = await self.get_product(product_id)

        if data.sku is not None and data.sku != product.sku:
            existing = await self.repository.get_by_sku(data.sku)
            if existing and str(existing.id) != product_id:
                raise ConflictError(f"Product with SKU '{data.sku}' already exists.")
            product.sku = data.sku

        if data.business_type is not None:
            product.business_type = data.business_type
        if data.product_name is not None:
            product.product_name = data.product_name
        if data.barcode is not None:
            product.barcode = data.barcode
        if data.category is not None:
            product.category = data.category
        if data.unit is not None:
            product.unit = data.unit
        if data.description is not None:
            product.description = data.description
        if data.is_active is not None:
            product.is_active = data.is_active

        return await self.repository.update(product)

    async def deactivate_product(self, product_id: str) -> MasterProduct:
        """Deactivate a master product (soft delete)."""
        product = await self.get_product(product_id)
        return await self.repository.deactivate(product)

    async def bulk_import(self, csv_content: str) -> MasterProductImportResult:
        """Bulk import master products from CSV content.

        CSV format: BusinessType,ProductName,SKU,Barcode,Category,Unit,Description
        If SKU exists -> update product
        If SKU doesn't exist -> create new product
        """
        result = MasterProductImportResult()
        reader = csv.reader(io.StringIO(csv_content))

        try:
            header = next(reader)
        except StopIteration:
            return result

        # Normalize header
        header = [h.strip().lower().replace(" ", "_") for h in header]

        for row_num, row in enumerate(reader, start=2):
            try:
                if len(row) < 3:
                    result.errors.append(f"Row {row_num}: Not enough columns")
                    continue

                # Map CSV columns to fields
                row_dict = dict(zip(header, row))

                business_type = row_dict.get("business_type", "").strip()
                product_name = row_dict.get("product_name", "").strip()
                sku = row_dict.get("sku", "").strip()
                barcode = row_dict.get("barcode", "").strip() or None
                category = row_dict.get("category", "").strip() or None
                unit = row_dict.get("unit", "").strip() or None
                description = row_dict.get("description", "").strip() or None

                # Validate required fields
                if not business_type or not product_name or not sku:
                    result.errors.append(f"Row {row_num}: Missing required fields (business_type, product_name, sku)")
                    continue

                if business_type not in VALID_BUSINESS_TYPES:
                    result.errors.append(
                        f"Row {row_num}: Invalid business_type '{business_type}'"
                    )
                    continue

                # Check if SKU exists
                existing = await self.repository.get_by_sku(sku)
                if existing:
                    # Update existing product
                    existing.product_name = product_name
                    existing.business_type = business_type
                    if barcode is not None:
                        existing.barcode = barcode
                    if category is not None:
                        existing.category = category
                    if unit is not None:
                        existing.unit = unit
                    if description is not None:
                        existing.description = description
                    await self.repository.update(existing)
                    result.updated += 1
                else:
                    # Create new product
                    product = MasterProduct(
                        business_type=business_type,
                        product_name=product_name,
                        sku=sku,
                        barcode=barcode,
                        category=category,
                        unit=unit,
                        description=description,
                    )
                    await self.repository.add(product)
                    result.created += 1

            except Exception as e:
                result.errors.append(f"Row {row_num}: {str(e)}")

        await self.repository.commit()
        return result

    @staticmethod
    def _to_read(product: MasterProduct) -> dict:
        """Convert MasterProduct to dict for serialization."""
        return {
            "id": str(product.id),
            "business_type": product.business_type,
            "product_name": product.product_name,
            "sku": product.sku,
            "barcode": product.barcode,
            "category": product.category,
            "unit": product.unit,
            "description": product.description,
            "is_active": product.is_active,
            "created_at": product.created_at,
            "updated_at": product.updated_at,
        }
