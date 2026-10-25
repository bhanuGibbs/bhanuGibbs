import unittest
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

from app.services.quotation_service import QuotationService


class QuotationServiceCalculationTests(unittest.IsolatedAsyncioTestCase):
    async def test_sync_items_rounds_line_amounts_and_document_totals_consistently(self) -> None:
        user_id = uuid4()
        company_id = uuid4()
        customer_id = uuid4()
        product_id = uuid4()
        quotation = SimpleNamespace(
            id=uuid4(),
            created_by_id=user_id,
            shipping_amount=Decimal("1.12"),
        )
        product = SimpleNamespace(
            id=product_id,
            company_id=company_id,
            created_by_id=user_id,
            name="Test product",
        )
        customer = SimpleNamespace(
            company_id=company_id,
            created_by_id=user_id,
            name="Test customer",
            email=None,
            phone_number=None,
            address=None,
        )
        company = SimpleNamespace(
            name="Test company",
            address=None,
            phone_number=None,
            email=None,
            website=None,
            gstin=None,
        )
        service = QuotationService(AsyncMock())
        service.item_repository.list_by_quotation = AsyncMock(return_value=[])
        service.item_repository.add = AsyncMock()
        service.product_repository.get = AsyncMock(return_value=product)
        service.customer_repository.get = AsyncMock(return_value=customer)
        service.company_repository.get = AsyncMock(return_value=company)

        await service._sync_items_and_totals(
            quotation,
            [
                {
                    "product_id": str(product_id),
                    "quantity": 1,
                    "unit_price": Decimal("0.05"),
                    "discount": Decimal("10"),
                    "gst": Decimal("7.5"),
                },
                {
                    "product_id": str(product_id),
                    "quantity": 3,
                    "unit_price": Decimal("1.01"),
                    "discount": Decimal("0"),
                    "gst": Decimal("8.25"),
                },
            ],
            str(company_id),
            str(customer_id),
        )

        self.assertEqual(quotation.subtotal, Decimal("3.08"))
        self.assertEqual(quotation.discount, Decimal("0.01"))
        self.assertEqual(quotation.tax_amount, Decimal("0.25"))
        self.assertEqual(quotation.shipping_amount, Decimal("1.12"))
        self.assertEqual(quotation.total_amount, Decimal("4.44"))
        saved_items = [call.args[0] for call in service.item_repository.add.await_args_list]
        self.assertEqual([item.amount for item in saved_items], [Decimal("0.04"), Decimal("3.28")])
