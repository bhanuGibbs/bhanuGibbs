import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from sqlalchemy.dialects.sqlite import dialect

from app.repositories.quotation_daily_sequence_repository import QuotationDailySequenceRepository


class QuotationDailySequenceRepositoryTests(unittest.IsolatedAsyncioTestCase):
    async def test_next_number_uses_atomic_company_date_upsert(self) -> None:
        session = AsyncMock()
        session.get_bind = MagicMock(return_value=SimpleNamespace(dialect=dialect()))
        result = MagicMock()
        result.scalar_one.return_value = 3
        session.execute.return_value = result
        repository = QuotationDailySequenceRepository(session)
        company_id = uuid4()
        issue_date = date(2026, 8, 9)

        number = await repository.next_number(str(company_id), issue_date)

        statement = session.execute.await_args.args[0]
        sql = str(statement.compile(dialect=dialect()))
        self.assertEqual(number, 3)
        self.assertIn("ON CONFLICT", sql)
        self.assertIn("sequence_date", sql)
        self.assertEqual(statement.compile(dialect=dialect()).params["sequence_date"], issue_date)

    async def test_next_number_rejects_unsupported_dialect(self) -> None:
        session = AsyncMock()
        session.get_bind = MagicMock(return_value=SimpleNamespace(dialect=SimpleNamespace(name="mysql")))

        with self.assertRaisesRegex(RuntimeError, "not supported"):
            await QuotationDailySequenceRepository(session).next_number(
                str(uuid4()), date(2026, 8, 9)
            )

        session.execute.assert_not_awaited()
