from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository[Customer]):
    """Repository for customer-related database operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Customer)

    async def get_by_email(self, email: str, company_id: str | None = None) -> Customer | None:
        """Return a customer by email address, optionally scoped to a company."""
        statement = select(Customer).where(Customer.email == email)
        if company_id:
            statement = statement.where(Customer.company_id == UUID(company_id))
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_by_name_and_company(self, name: str, company_id: str) -> Customer | None:
        """Return a customer by name within a company."""
        statement = select(Customer).where(Customer.name == name, Customer.company_id == UUID(company_id))
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def list_by_company(self, company_id: str) -> list[Customer]:
        """Return all customers for a specific company."""
        statement = select(Customer).where(Customer.company_id == UUID(company_id)).order_by(Customer.created_at.desc())
        result = await self.session.execute(statement)
        return result.scalars().all()
