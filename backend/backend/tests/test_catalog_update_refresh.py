import unittest
from decimal import Decimal

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.models  # noqa: F401 - registers all models and foreign-key targets
from app.core.database import Base
from app.models.customer import Customer
from app.models.product import Product
from app.schemas.customer import CustomerRead
from app.schemas.product import ProductRead
from app.services.customer_service import CustomerService
from app.services.product_service import ProductService


class CatalogUpdateRefreshTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)
        self.session = self.session_factory()

    async def asyncTearDown(self) -> None:
        await self.session.close()
        await self.engine.dispose()

    async def test_customer_update_refreshes_database_managed_timestamp(self) -> None:
        customer = Customer(name="Before update", email="customer@example.com")
        self.session.add(customer)
        await self.session.commit()

        updated = await CustomerService(self.session).update_customer(
            str(customer.id), name="After update"
        )

        response = CustomerRead.model_validate(updated)
        self.assertEqual(response.name, "After update")
        self.assertIsNotNone(response.updated_at)

    async def test_product_update_refreshes_database_managed_timestamp(self) -> None:
        product = Product(name="Before update", price=Decimal("12.50"))
        self.session.add(product)
        await self.session.commit()

        updated = await ProductService(self.session).update_product(
            str(product.id), name="After update", price=Decimal("15.75")
        )

        response = ProductRead.model_validate(updated)
        self.assertEqual(response.name, "After update")
        self.assertEqual(response.price, Decimal("15.75"))
        self.assertIsNotNone(response.updated_at)


if __name__ == "__main__":
    unittest.main()
