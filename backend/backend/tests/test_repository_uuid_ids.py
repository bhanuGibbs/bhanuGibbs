import unittest
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

from app.models.customer import Customer
from app.models.quotation import Quotation
from app.models.quotation_item import QuotationItem
from app.repositories.base import BaseRepository
from app.repositories.quotation_item_repository import QuotationItemRepository


class RepositoryUuidIdTests(unittest.IsolatedAsyncioTestCase):
    async def test_get_converts_string_primary_key_to_uuid(self) -> None:
        session = AsyncMock()
        repository = BaseRepository(session, Customer)
        customer_id = uuid.uuid4()

        await repository.get(str(customer_id))

        session.get.assert_awaited_once_with(Customer, customer_id)

    async def test_get_returns_none_for_invalid_uuid(self) -> None:
        session = AsyncMock()
        repository = BaseRepository(session, Customer)

        result = await repository.get("invalid")

        self.assertIsNone(result)
        session.get.assert_not_awaited()

    async def test_list_by_quotation_converts_string_id_to_uuid(self) -> None:
        session = AsyncMock()
        result = MagicMock()
        result.scalars.return_value.all.return_value = []
        session.execute.return_value = result
        repository = QuotationItemRepository(session)
        quotation_id = uuid.uuid4()

        await repository.list_by_quotation(str(quotation_id))

        statement = session.execute.await_args.args[0]
        self.assertEqual(statement.whereclause.right.value, quotation_id)
        self.assertIsInstance(statement.whereclause.right.value, uuid.UUID)

    def test_quotation_model_accepts_issued_at(self) -> None:
        issued_at = datetime(2026, 10, 22)

        quotation = Quotation(
            reference_number="QT-TEST-0001",
            title="Quotation",
            customer_id=uuid.uuid4(),
            company_id=uuid.uuid4(),
            issued_at=issued_at,
        )

        self.assertEqual(quotation.issued_at, issued_at)
