from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quotation_daily_sequence import QuotationDailySequence


class QuotationDailySequenceRepository:
    """Allocate unique per-company quotation numbers for each issue date."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def next_number(self, company_id: str, sequence_date: date) -> int:
        dialect_name = self.session.get_bind().dialect.name
        table = QuotationDailySequence.__table__
        values = {
            "company_id": UUID(company_id),
            "sequence_date": sequence_date,
            "last_number": 1,
        }

        if dialect_name == "sqlite":
            statement = sqlite_insert(QuotationDailySequence).values(**values)
        elif dialect_name == "postgresql":
            statement = postgresql_insert(QuotationDailySequence).values(**values)
        else:
            raise RuntimeError(f"Daily quotation numbering is not supported for database dialect {dialect_name}.")

        statement = (
            statement.on_conflict_do_update(
                index_elements=[table.c.company_id, table.c.sequence_date],
                set_={"last_number": table.c.last_number + 1},
            )
            .returning(table.c.last_number)
        )
        result = await self.session.execute(statement)
        number = result.scalar_one()
        if not isinstance(number, int):
            raise RuntimeError("The database did not return a valid quotation sequence number.")
        return number
