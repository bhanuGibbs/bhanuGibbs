from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pos_category import POSCategory


class POSCategoryRepository:
    """Repository for POS category data access."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, category_id: str) -> POSCategory | None:
        """Get a category by ID."""
        result = await self.session.execute(
            select(POSCategory).where(POSCategory.id == category_id)
        )
        return result.scalar_one_or_none()

    async def list_by_company(self, company_id: str, active_only: bool = True) -> list[POSCategory]:
        """List categories for a company."""
        statement = select(POSCategory).where(POSCategory.company_id == company_id)
        if active_only:
            statement = statement.where(POSCategory.is_active == True)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def add(self, category: POSCategory) -> POSCategory:
        """Add a new category."""
        self.session.add(category)
        await self.session.flush()
        return category

    async def update(self, category: POSCategory) -> POSCategory:
        """Update an existing category."""
        await self.session.flush()
        return category

    async def delete(self, category: POSCategory) -> None:
        """Delete a category."""
        await self.session.delete(category)
        await self.session.flush()

    async def commit(self) -> None:
        """Commit the session."""
        await self.session.commit()
