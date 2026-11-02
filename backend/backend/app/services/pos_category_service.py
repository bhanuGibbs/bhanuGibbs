from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pos_category import POSCategory
from app.repositories.pos_category_repository import POSCategoryRepository
from app.services.exceptions import ConflictError, NotFoundError


class POSCategoryService:
    """Service layer for POS category business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = POSCategoryRepository(session)

    async def create_category(
        self, company_id: str, name: str, description: str | None = None
    ) -> POSCategory:
        """Create a new category."""
        category = POSCategory(
            company_id=company_id,
            name=name,
            description=description,
        )
        return await self.repository.add(category)

    async def get_category(self, category_id: str, company_id: str) -> POSCategory:
        """Get a category by ID, verifying company ownership."""
        category = await self.repository.get(category_id)
        if not category or str(category.company_id) != company_id:
            raise NotFoundError("Category not found.")
        return category

    async def list_categories(self, company_id: str, active_only: bool = True) -> list[POSCategory]:
        """List categories for a company."""
        return await self.repository.list_by_company(company_id, active_only)

    async def update_category(
        self, category_id: str, company_id: str, name: str | None = None, description: str | None = None, is_active: bool | None = None
    ) -> POSCategory:
        """Update a category."""
        category = await self.get_category(category_id, company_id)
        if name is not None:
            category.name = name
        if description is not None:
            category.description = description
        if is_active is not None:
            category.is_active = is_active
        return await self.repository.update(category)

    async def delete_category(self, category_id: str, company_id: str) -> None:
        """Delete a category."""
        category = await self.get_category(category_id, company_id)
        await self.repository.delete(category)
        await self.repository.commit()

    async def save(self) -> None:
        """Commit pending changes."""
        await self.repository.commit()
