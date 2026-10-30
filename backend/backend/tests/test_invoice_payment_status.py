import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

from app.services.exceptions import BadRequestError, NotFoundError
from app.services.quotation_service import QuotationService


class InvoicePaymentStatusTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.user_id = str(uuid4())
        self.company_id = str(uuid4())
        self.invoice = SimpleNamespace(
            id=uuid4(),
            title="Invoice",
            status="Final",
            company_id=self.company_id,
            created_by_id=self.user_id,
        )
        self.service = QuotationService(AsyncMock())
        self.service.repository.session.add = Mock()
        self.service.repository.get = AsyncMock(return_value=self.invoice)
        self.service.repository.commit = AsyncMock()
        self.service.repository.session.refresh = AsyncMock()

    async def test_final_invoice_can_be_marked_paid_and_unpaid(self) -> None:
        paid = await self.service.update_invoice_payment_status(
            str(self.invoice.id), self.company_id, self.user_id, "Paid"
        )
        self.assertEqual(paid.status, "Paid")

        unpaid = await self.service.update_invoice_payment_status(
            str(self.invoice.id), self.company_id, self.user_id, "Unpaid"
        )
        self.assertEqual(unpaid.status, "Unpaid")
        self.assertEqual(self.service.repository.commit.await_count, 2)

    async def test_payment_status_cannot_be_changed_for_quotation(self) -> None:
        self.invoice.title = "Quotation"
        with self.assertRaises(BadRequestError):
            await self.service.update_invoice_payment_status(
                str(self.invoice.id), self.company_id, self.user_id, "Paid"
            )
        self.service.repository.commit.assert_not_awaited()

    async def test_draft_invoice_cannot_be_marked_paid(self) -> None:
        self.invoice.status = "Draft"
        with self.assertRaises(BadRequestError):
            await self.service.update_invoice_payment_status(
                str(self.invoice.id), self.company_id, self.user_id, "Paid"
            )
        self.service.repository.commit.assert_not_awaited()

    async def test_payment_status_is_scoped_to_owner_and_company(self) -> None:
        with self.assertRaises(NotFoundError):
            await self.service.update_invoice_payment_status(
                str(self.invoice.id), str(uuid4()), self.user_id, "Paid"
            )
        with self.assertRaises(NotFoundError):
            await self.service.update_invoice_payment_status(
                str(self.invoice.id), self.company_id, str(uuid4()), "Paid"
            )
        self.service.repository.commit.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
