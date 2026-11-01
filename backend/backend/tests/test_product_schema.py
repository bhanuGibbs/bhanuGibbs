import unittest
from decimal import Decimal

from pydantic import ValidationError

from app.schemas.product import ProductCreate, ProductUpdate


class ProductPriceValidationTests(unittest.TestCase):
    def test_create_requires_at_least_one_cent(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Sample", price=Decimal("0"))

        product = ProductCreate(name="Sample", price=Decimal("0.01"))
        self.assertEqual(product.price, Decimal("0.01"))

    def test_update_rejects_zero_price(self) -> None:
        with self.assertRaises(ValidationError):
            ProductUpdate(price=Decimal("0"))

        update = ProductUpdate(price=Decimal("0.01"))
        self.assertEqual(update.price, Decimal("0.01"))


if __name__ == "__main__":
    unittest.main()
