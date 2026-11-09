from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.challan_product import ChallanProduct
from app.repositories.challan_product_repository import ChallanProductRepository
from app.services.exceptions import NotFoundError, ServiceError


class ChallanProductService:
    """Service layer for challan product business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = ChallanProductRepository(session)

    async def create_challan_product(
        self,
        crop: str,
        value: Decimal,
        variety: str | None = None,
        seed_class: str | None = None,
        lot_no: str | None = None,
        unit_size: str | None = None,
        unit_per_sack_box: int | None = None,
        sack_box: int | None = None,
        company_id: str | None = None,
        created_by_id: str | None = None,
        commit: bool = True,
    ) -> ChallanProduct:
        """Create a new challan product within a company."""
        product = ChallanProduct(
            crop=crop,
            value=value,
            variety=variety,
            seed_class=seed_class,
            lot_no=lot_no,
            unit_size=unit_size,
            unit_per_sack_box=unit_per_sack_box,
            sack_box=sack_box,
            company_id=UUID(company_id) if company_id else None,
            created_by_id=UUID(created_by_id) if created_by_id else None,
        )
        try:
            await self.repository.add(product)
            if commit:
                await self.repository.commit()
        except IntegrityError:
            await self.repository.rollback()
            raise
        return product

    async def list_challan_products(self, company_id: str, user_id: str) -> list[ChallanProduct]:
        """List challan products for the authenticated user within a company."""
        return await self.repository.list_by_company(company_id, user_id)

    async def get_challan_product(self, product_id: str) -> ChallanProduct | None:
        """Retrieve a challan product by UUID."""
        return await self.repository.get(product_id)

    async def update_challan_product(
        self,
        product_id: str,
        crop: str | None = None,
        variety: str | None = None,
        seed_class: str | None = None,
        lot_no: str | None = None,
        unit_size: str | None = None,
        unit_per_sack_box: int | None = None,
        sack_box: int | None = None,
        value: Decimal | None = None,
    ) -> ChallanProduct:
        """Update an existing challan product."""
        product = await self.repository.get(product_id)
        if not product:
            raise NotFoundError("Challan product not found.")

        if crop is not None:
            product.crop = crop
        if variety is not None:
            product.variety = variety
        if seed_class is not None:
            product.seed_class = seed_class
        if lot_no is not None:
            product.lot_no = lot_no
        if unit_size is not None:
            product.unit_size = unit_size
        if unit_per_sack_box is not None:
            product.unit_per_sack_box = unit_per_sack_box
        if sack_box is not None:
            product.sack_box = sack_box
        if value is not None:
            product.value = value

        try:
            await self.repository.commit()
        except IntegrityError:
            await self.repository.rollback()
            raise
        await self.repository.session.refresh(product)
        return product

    async def delete_challan_product(self, product_id: str) -> None:
        """Delete a challan product."""
        product = await self.repository.get(product_id)
        if not product:
            raise NotFoundError("Challan product not found.")

        await self.repository.delete(product)
        try:
            await self.repository.commit()
        except IntegrityError:
            await self.repository.rollback()
            raise ServiceError("Cannot delete this challan product because it is referenced in one or more challans.")
