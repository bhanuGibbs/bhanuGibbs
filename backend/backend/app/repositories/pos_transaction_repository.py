from __future__ import annotations

import uuid
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pos_transaction import POSTransaction
from app.models.pos_transaction_item import POSTransactionItem
from app.models.pos_payment import POSPayment
from app.models.pos_return import POSReturn
from app.models.pos_return_item import POSReturnItem


class POSTransactionRepository:
    """Repository for POS transaction data access."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, transaction_id: str) -> POSTransaction | None:
        """Get a transaction by ID."""
        result = await self.session.execute(
            select(POSTransaction).where(POSTransaction.id == uuid.UUID(transaction_id))
        )
        return result.scalar_one_or_none()

    async def list_by_company(
        self, company_id: str, start_date: date | None = None, end_date: date | None = None, status: str | None = None, limit: int | None = None
    ) -> list[POSTransaction]:
        """List transactions for a company with optional filters."""
        statement = select(POSTransaction).where(POSTransaction.company_id == uuid.UUID(company_id))
        if start_date:
            statement = statement.where(POSTransaction.created_at >= start_date)
        if end_date:
            statement = statement.where(POSTransaction.created_at <= end_date)
        if status:
            statement = statement.where(POSTransaction.status == status)
        statement = statement.order_by(POSTransaction.created_at.desc())
        if limit:
            statement = statement.limit(limit)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_items(self, transaction_id: str) -> list[POSTransactionItem]:
        """Get all items for a transaction."""
        result = await self.session.execute(
            select(POSTransactionItem).where(POSTransactionItem.transaction_id == uuid.UUID(transaction_id))
        )
        return list(result.scalars().all())

    async def get_payments(self, transaction_id: str) -> list[POSPayment]:
        """Get all payments for a transaction."""
        result = await self.session.execute(
            select(POSPayment).where(POSPayment.transaction_id == uuid.UUID(transaction_id))
        )
        return list(result.scalars().all())

    async def add(self, transaction: POSTransaction) -> POSTransaction:
        """Add a new transaction."""
        self.session.add(transaction)
        await self.session.flush()
        return transaction

    async def add_item(self, item: POSTransactionItem) -> POSTransactionItem:
        """Add a transaction item."""
        self.session.add(item)
        await self.session.flush()
        return item

    async def add_payment(self, payment: POSPayment) -> POSPayment:
        """Add a payment."""
        self.session.add(payment)
        await self.session.flush()
        return payment

    async def add_return(self, ret: POSReturn) -> POSReturn:
        """Add a return."""
        self.session.add(ret)
        await self.session.flush()
        return ret

    async def add_return_item(self, item: POSReturnItem) -> POSReturnItem:
        """Add a return item."""
        self.session.add(item)
        await self.session.flush()
        return item

    async def get_returns(self, transaction_id: str) -> list[POSReturn]:
        """Get all returns for a transaction."""
        result = await self.session.execute(
            select(POSReturn).where(POSReturn.transaction_id == uuid.UUID(transaction_id))
        )
        return list(result.scalars().all())

    async def get_return_items(self, return_id: str) -> list[POSReturnItem]:
        """Get all items for a return."""
        result = await self.session.execute(
            select(POSReturnItem).where(POSReturnItem.return_id == uuid.UUID(return_id))
        )
        return list(result.scalars().all())

    async def list_returns_by_company(self, company_id: str) -> list[POSReturn]:
        """List returns for a company."""
        result = await self.session.execute(
            select(POSReturn).where(POSReturn.company_id == uuid.UUID(company_id)).order_by(POSReturn.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_today_stats(self, company_id: str, today: date) -> dict[str, Decimal]:
        """Get today's transaction stats."""
        tomorrow = today + __import__('datetime').timedelta(days=1)
        result = await self.session.execute(
            select(
                func.count(POSTransaction.id),
                func.coalesce(func.sum(POSTransaction.grand_total), 0),
                func.coalesce(func.sum(POSTransaction.discount), 0),
                func.coalesce(func.sum(POSTransaction.tax_amount), 0),
            ).where(
                and_(
                    POSTransaction.company_id == uuid.UUID(company_id),
                    POSTransaction.created_at >= today,
                    POSTransaction.created_at < tomorrow,
                    POSTransaction.status == "completed",
                )
            )
        )
        row = result.one()
        return {
            "count": row[0],
            "revenue": row[1],
            "discount": row[2],
            "tax": row[3],
        }

    async def commit(self) -> None:
        """Commit the session."""
        await self.session.commit()
