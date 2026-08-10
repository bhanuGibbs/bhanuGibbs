from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.repositories.base import BaseRepository


class CompanyRepository(BaseRepository[Company]):
    """Repository for company-related database operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Company)

    async def get_by_name(self, name: str) -> Company | None:
        """Return a company by its name."""
        statement = select(Company).where(Company.name == name)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def list_all(self) -> list[Company]:
        """Return all companies."""
        statement = select(Company)
        result = await self.session.execute(statement)
        return result.scalars().all()
