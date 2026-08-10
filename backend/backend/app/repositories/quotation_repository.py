from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quotation import Quotation
from app.repositories.base import BaseRepository


class QuotationRepository(BaseRepository[Quotation]):
    """Repository for quotation-related database operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Quotation)

    async def get_by_reference(self, reference_number: str, company_id: str | None = None) -> Quotation | None:
        """Return a quotation by reference number, optionally scoped to a company."""
        statement = select(Quotation).where(Quotation.reference_number == reference_number)
        if company_id:
            statement = statement.where(Quotation.company_id == UUID(company_id))
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def list_by_user(self, user_id: str) -> list[Quotation]:
        """Return all quotations created by a specific user."""
        statement = select(Quotation).where(Quotation.created_by_id == UUID(user_id)).order_by(Quotation.created_at.desc())
        result = await self.session.execute(statement)
        return result.scalars().all()

    async def list_by_company(self, company_id: str) -> list[Quotation]:
        """Return all quotations for a specific company."""
        statement = select(Quotation).where(Quotation.company_id == UUID(company_id)).order_by(Quotation.created_at.desc())
        result = await self.session.execute(statement)
        return result.scalars().all()

    async def get_latest_draft_by_user(self, user_id: str, company_id: str) -> Quotation | None:
        """Return the most recent draft quotation for a user within a company."""
        statement = (
            select(Quotation)
            .where(
                Quotation.created_by_id == UUID(user_id),
                Quotation.company_id == UUID(company_id),
                Quotation.status == 'Draft',
            )
            .order_by(Quotation.created_at.desc())
        )
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def list_all(self) -> list[Quotation]:
        """Return all quotations."""
        statement = select(Quotation)
        result = await self.session.execute(statement)
        return result.scalars().all()
