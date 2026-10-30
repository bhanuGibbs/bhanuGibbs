import unittest
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi import HTTPException

from app.api.quotation_router import _resolve_quotation_product
from app.schemas.quotation import QuotationSubmitItem


class QuotationProductResolutionTests(unittest.IsolatedAsyncioTestCase):
    async def test_existing_product_selection_is_owner_scoped(self) -> None:
        product_id, company_id, user_id = uuid4(), uuid4(), uuid4()
        product = SimpleNamespace(id=product_id, company_id=company_id, created_by_id=user_id)
        service = SimpleNamespace(get_product=AsyncMock(return_value=product))
        item = QuotationSubmitItem(
            product_id=product_id,
            product_name="Catalog product",
            quantity=2,
            unit_price=25,
        )

        resolved = await _resolve_quotation_product(
            item, service, str(company_id), {"id": str(user_id)}
        )

        self.assertIs(resolved, product)
        service.get_product.assert_awaited_once_with(str(product_id))

    async def test_product_selection_rejects_another_users_product(self) -> None:
        product_id, company_id = uuid4(), uuid4()
        product = SimpleNamespace(id=product_id, company_id=company_id, created_by_id=uuid4())
        service = SimpleNamespace(get_product=AsyncMock(return_value=product))
        item = QuotationSubmitItem(product_id=product_id, quantity=1, unit_price=25)

        with self.assertRaises(HTTPException) as error:
            await _resolve_quotation_product(item, service, str(company_id), {"id": str(uuid4())})

        self.assertEqual(error.exception.status_code, 404)

    async def test_manual_product_is_saved_with_catalog_details(self) -> None:
        company_id, user_id = str(uuid4()), str(uuid4())
        service = SimpleNamespace(
            repository=SimpleNamespace(
                get_by_sku=AsyncMock(return_value=None),
                get_by_name_and_company=AsyncMock(return_value=None),
            ),
            create_product=AsyncMock(return_value=SimpleNamespace(id=uuid4())),
        )
        item = QuotationSubmitItem(
            product_name="New product",
            description="Product description",
            sku="SKU-123",
            hsn_code="HSN-456",
            unit="hour",
            quantity=1,
            unit_price=Decimal("12.50"),
            gst=Decimal("18"),
        )

        await _resolve_quotation_product(item, service, company_id, {"id": user_id})

        service.create_product.assert_awaited_once_with(
            name="New product",
            price=Decimal("12.50"),
            description="Product description",
            sku="SKU-123",
            gst_percentage=Decimal("18"),
            unit="hour",
            hsn_code="HSN-456",
            company_id=company_id,
            created_by_id=user_id,
            commit=False,
        )
