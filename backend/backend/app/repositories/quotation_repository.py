from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quotation import Quotation
from app.models.quotation_finalization_usage import QuotationFinalizationUsage
from app.models.user import User
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

    async def list_by_company(self, company_id: str, user_id: str) -> list[Quotation]:
        """Return quotations owned by a user within a company."""
        statement = select(Quotation).where(
            Quotation.company_id == UUID(company_id), Quotation.created_by_id == UUID(user_id)
        ).order_by(Quotation.created_at.desc())
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

    async def lock_user_for_finalization(self, user_id: str) -> str:
        """Serialize plan reads and quota checks by locking the user row."""
        statement = select(User.subscription_plan).where(
            User.id == UUID(user_id)
        ).with_for_update()
        result = await self.session.execute(statement)
        plan = result.scalar_one_or_none()
        if plan is None:
            raise RuntimeError("Cannot finalize a quotation for a missing user.")
        return plan

    async def count_finalized_by_user_between(
        self, user_id: str, start: datetime, end: datetime
    ) -> int:
        """Count quotations finalized by a user in a half-open date range."""
        statement = select(func.count(QuotationFinalizationUsage.id)).where(
            QuotationFinalizationUsage.user_id == UUID(user_id),
            QuotationFinalizationUsage.finalized_at >= start,
            QuotationFinalizationUsage.finalized_at < end,
        )
        result = await self.session.execute(statement)
        return result.scalar_one()

    async def record_finalization(
        self, user_id: str, quotation_id: str, finalized_at: datetime
    ) -> None:
        self.session.add(
            QuotationFinalizationUsage(
                user_id=UUID(user_id),
                quotation_id=UUID(quotation_id),
                finalized_at=finalized_at,
            )
        )
        await self.session.flush()

    async def list_all(self) -> list[Quotation]:
        """Return all quotations."""
        statement = select(Quotation)
        result = await self.session.execute(statement)
        return result.scalars().all()
