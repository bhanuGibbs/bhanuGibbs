import unittest
from decimal import Decimal
from datetime import datetime, timedelta

from pydantic import ValidationError

from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.schemas.company import CompanyCreate
from app.schemas.quotation import (
    QuotationSubmit,
    QuotationSubmitItem,
    QuotationCustomerInfo,
    QuotationItemCreate,
    QuotationUpdate,
    InvoicePaymentStatusUpdate,
)


class ProductEdgeCaseTests(unittest.TestCase):
    """Edge cases for product schema validation."""

    def test_empty_name_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="", price=Decimal("10"))

    def test_whitespace_only_name_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="   ", price=Decimal("10"))

    def test_name_exceeding_255_chars_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="A" * 256, price=Decimal("10"))

    def test_name_exactly_255_chars_accepted(self) -> None:
        product = ProductCreate(name="A" * 255, price=Decimal("10"))
        self.assertEqual(len(product.name), 255)

    def test_negative_price_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("-1"))

    def test_zero_price_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("0"))

    def test_minimum_price_accepted(self) -> None:
        product = ProductCreate(name="Test", price=Decimal("0.01"))
        self.assertEqual(product.price, Decimal("0.01"))

    def test_very_large_price_accepted(self) -> None:
        product = ProductCreate(name="Test", price=Decimal("999999999.99"))
        self.assertEqual(product.price, Decimal("999999999.99"))

    def test_gst_percentage_zero_accepted(self) -> None:
        product = ProductCreate(name="Test", price=Decimal("10"), gst_percentage=Decimal("0"))
        self.assertEqual(product.gst_percentage, Decimal("0"))

    def test_gst_percentage_100_accepted(self) -> None:
        product = ProductCreate(name="Test", price=Decimal("10"), gst_percentage=Decimal("100"))
        self.assertEqual(product.gst_percentage, Decimal("100"))

    def test_gst_percentage_over_100_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("10"), gst_percentage=Decimal("100.01"))

    def test_negative_gst_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("10"), gst_percentage=Decimal("-1"))

    def test_sku_exceeding_100_chars_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("10"), sku="A" * 101)

    def test_sku_exactly_100_chars_accepted(self) -> None:
        product = ProductCreate(name="Test", price=Decimal("10"), sku="A" * 100)
        self.assertEqual(len(product.sku), 100)

    def test_description_exceeding_1024_chars_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("10"), description="A" * 1025)

    def test_description_exactly_1024_chars_accepted(self) -> None:
        product = ProductCreate(name="Test", price=Decimal("10"), description="A" * 1024)
        self.assertEqual(len(product.description), 1024)

    def test_unit_exceeding_50_chars_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("10"), unit="A" * 51)

    def test_hsn_code_too_short_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("10"), hsn_code="1")

    def test_hsn_code_exactly_2_chars_accepted(self) -> None:
        product = ProductCreate(name="Test", price=Decimal("10"), hsn_code="12")
        self.assertEqual(product.hsn_code, "12")

    def test_hsn_code_exactly_8_chars_accepted(self) -> None:
        product = ProductCreate(name="Test", price=Decimal("10"), hsn_code="12345678")
        self.assertEqual(product.hsn_code, "12345678")

    def test_hsn_code_too_long_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("10"), hsn_code="123456789")

    def test_hsn_code_with_special_chars_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("10"), hsn_code="12-34")

    def test_hsn_code_with_spaces_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(name="Test", price=Decimal("10"), hsn_code="12 34")

    def test_hsn_code_none_accepted(self) -> None:
        product = ProductCreate(name="Test", price=Decimal("10"), hsn_code=None)
        self.assertIsNone(product.hsn_code)

    def test_update_with_empty_dict_applies_no_changes(self) -> None:
        update = ProductUpdate()
        self.assertIsNone(update.name)
        self.assertIsNone(update.price)

    def test_update_name_whitespace_only_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProductUpdate(name="   ")

    def test_special_chars_in_name_accepted(self) -> None:
        product = ProductCreate(name="Test Product (v2.0)", price=Decimal("10"))
        self.assertEqual(product.name, "Test Product (v2.0)")

    def test_unicode_name_accepted(self) -> None:
        product = ProductCreate(name="Продукт", price=Decimal("10"))
        self.assertEqual(product.name, "Продукт")


class CustomerEdgeCaseTests(unittest.TestCase):
    """Edge cases for customer schema validation."""

    def test_empty_name_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="")

    def test_name_with_special_chars_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test@Customer")

    def test_name_with_underscore_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test_Customer")

    def test_name_with_apostrophe_accepted(self) -> None:
        customer = CustomerCreate(name="O'Brien")
        self.assertEqual(customer.name, "O'Brien")

    def test_name_with_hyphen_accepted(self) -> None:
        customer = CustomerCreate(name="Mary-Jane")
        self.assertEqual(customer.name, "Mary-Jane")

    def test_name_with_dot_accepted(self) -> None:
        customer = CustomerCreate(name="John.Doe")
        self.assertEqual(customer.name, "John.Doe")

    def test_name_starting_with_number_accepted(self) -> None:
        customer = CustomerCreate(name="123Business")
        self.assertEqual(customer.name, "123Business")

    def test_name_starting_with_space_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name=" Test")

    def test_phone_number_too_short_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", phone_number="12345")

    def test_phone_number_exactly_6_digits_accepted(self) -> None:
        customer = CustomerCreate(name="Test", phone_number="123456")
        self.assertEqual(customer.phone_number, "123456")

    def test_phone_number_exactly_15_digits_accepted(self) -> None:
        customer = CustomerCreate(name="Test", phone_number="123456789012345")
        self.assertEqual(customer.phone_number, "123456789012345")

    def test_phone_number_too_long_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", phone_number="1234567890123456")

    def test_phone_number_with_plus_accepted(self) -> None:
        customer = CustomerCreate(name="Test", phone_number="+911234567890")
        self.assertEqual(customer.phone_number, "+911234567890")

    def test_phone_number_with_letters_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", phone_number="12345abc")

    def test_phone_number_with_spaces_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", phone_number="123 456 7890")

    def test_empty_phone_number_treated_as_none(self) -> None:
        customer = CustomerCreate(name="Test", phone_number="")
        self.assertIsNone(customer.phone_number)

    def test_whitespace_phone_number_treated_as_none(self) -> None:
        customer = CustomerCreate(name="Test", phone_number="   ")
        self.assertIsNone(customer.phone_number)

    def test_pincode_too_short_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", pincode="12")

    def test_pincode_exactly_3_chars_accepted(self) -> None:
        customer = CustomerCreate(name="Test", pincode="123")
        self.assertEqual(customer.pincode, "123")

    def test_pincode_exactly_10_chars_accepted(self) -> None:
        customer = CustomerCreate(name="Test", pincode="1234567890")
        self.assertEqual(customer.pincode, "1234567890")

    def test_pincode_too_long_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", pincode="12345678901")

    def test_gstin_empty_treated_as_none(self) -> None:
        customer = CustomerCreate(name="Test", gstin="")
        self.assertIsNone(customer.gstin)

    def test_gstin_max_length_accepted(self) -> None:
        customer = CustomerCreate(name="Test", gstin="A" * 20)
        self.assertEqual(customer.gstin, "A" * 20)

    def test_gstin_too_long_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", gstin="A" * 21)

    def test_address_max_length_accepted(self) -> None:
        customer = CustomerCreate(name="Test", address="A" * 512)
        self.assertEqual(len(customer.address), 512)

    def test_address_too_long_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", address="A" * 513)

    def test_invalid_email_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", email="not-an-email")

    def test_valid_email_accepted(self) -> None:
        customer = CustomerCreate(name="Test", email="test@example.com")
        self.assertEqual(customer.email, "test@example.com")

    def test_all_optional_fields_none(self) -> None:
        customer = CustomerCreate(name="Test")
        self.assertIsNone(customer.email)
        self.assertIsNone(customer.phone_number)
        self.assertIsNone(customer.address)

    def test_company_name_with_special_chars_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", company_name="Company@Name")

    def test_state_with_special_chars_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CustomerCreate(name="Test", state="State#Name")


class CompanyEdgeCaseTests(unittest.TestCase):
    """Edge cases for company schema validation."""

    def test_empty_name_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CompanyCreate(name="")

    def test_name_with_special_chars_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CompanyCreate(name="Company@Name")

    def test_business_profile_invoice_accepted(self) -> None:
        company = CompanyCreate(name="Test", business_profile="invoice")
        self.assertEqual(company.business_profile, "invoice")

    def test_business_profile_pos_accepted(self) -> None:
        company = CompanyCreate(name="Test", business_profile="pos")
        self.assertEqual(company.business_profile, "pos")

    def test_company_logo_and_seal_images_accepted(self) -> None:
        company = CompanyCreate(
            name="Test",
            logo_data="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
            seal_data="data:image/jpeg;base64,/9j/2Q==",
        )
        self.assertTrue(company.logo_data.startswith("data:image/png;base64,"))
        self.assertTrue(company.seal_data.startswith("data:image/jpeg;base64,"))

    def test_company_image_with_mismatched_content_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CompanyCreate(name="Test", logo_data="data:image/png;base64,bm90YW5pbWFnZQ==")

    def test_business_profile_invalid_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CompanyCreate(name="Test", business_profile="ecommerce")

    def test_business_profile_uppercase_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CompanyCreate(name="Test", business_profile="INVOICE")

    def test_phone_number_empty_treated_as_none(self) -> None:
        company = CompanyCreate(name="Test", phone_number="")
        self.assertIsNone(company.phone_number)

    def test_gstin_empty_treated_as_none(self) -> None:
        company = CompanyCreate(name="Test", gstin="")
        self.assertIsNone(company.gstin)

    def test_address_max_length(self) -> None:
        company = CompanyCreate(name="Test", address="A" * 512)
        self.assertEqual(len(company.address), 512)

    def test_address_too_long_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            CompanyCreate(name="Test", address="A" * 513)


class QuotationEdgeCaseTests(unittest.TestCase):
    """Edge cases for quotation schema validation."""

    def _min_customer(self):
        return QuotationCustomerInfo(name="Test Customer")

    def _min_item(self, **overrides):
        kwargs = {
            "quantity": 1,
            "unit_price": Decimal("10"),
        }
        kwargs.update(overrides)
        return QuotationSubmitItem(**kwargs)

    def test_empty_title_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmit(
                title="",
                issued_at=datetime.now(),
                customer=self._min_customer(),
                items=[self._min_item()],
            )

    def test_title_255_chars_accepted(self) -> None:
        q = QuotationSubmit(
            title="A" * 255,
            issued_at=datetime.now(),
            customer=self._min_customer(),
            items=[self._min_item()],
        )
        self.assertEqual(len(q.title), 255)

    def test_title_256_chars_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmit(
                title="A" * 256,
                issued_at=datetime.now(),
                customer=self._min_customer(),
                items=[self._min_item()],
            )

    def test_empty_items_list_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmit(
                title="Test",
                issued_at=datetime.now(),
                customer=self._min_customer(),
                items=[],
            )

    def test_zero_quantity_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmitItem(quantity=0, unit_price=Decimal("10"))

    def test_negative_quantity_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmitItem(quantity=-1, unit_price=Decimal("10"))

    def test_zero_unit_price_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmitItem(quantity=1, unit_price=Decimal("0"))

    def test_negative_unit_price_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmitItem(quantity=1, unit_price=Decimal("-1"))

    def test_minimum_unit_price_accepted(self) -> None:
        item = QuotationSubmitItem(quantity=1, unit_price=Decimal("0.01"))
        self.assertEqual(item.unit_price, Decimal("0.01"))

    def test_discount_zero_accepted(self) -> None:
        item = QuotationSubmitItem(quantity=1, unit_price=Decimal("10"), discount=Decimal("0"))
        self.assertEqual(item.discount, Decimal("0"))

    def test_discount_100_accepted(self) -> None:
        item = QuotationSubmitItem(quantity=1, unit_price=Decimal("10"), discount=Decimal("100"))
        self.assertEqual(item.discount, Decimal("100"))

    def test_discount_over_100_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmitItem(quantity=1, unit_price=Decimal("10"), discount=Decimal("100.01"))

    def test_negative_discount_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmitItem(quantity=1, unit_price=Decimal("10"), discount=Decimal("-1"))

    def test_gst_zero_accepted(self) -> None:
        item = QuotationSubmitItem(quantity=1, unit_price=Decimal("10"), gst=Decimal("0"))
        self.assertEqual(item.gst, Decimal("0"))

    def test_gst_100_accepted(self) -> None:
        item = QuotationSubmitItem(quantity=1, unit_price=Decimal("10"), gst=Decimal("100"))
        self.assertEqual(item.gst, Decimal("100"))

    def test_gst_over_100_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmitItem(quantity=1, unit_price=Decimal("10"), gst=Decimal("100.01"))

    def test_negative_gst_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmitItem(quantity=1, unit_price=Decimal("10"), gst=Decimal("-1"))

    def test_shipping_amount_zero_accepted(self) -> None:
        q = QuotationSubmit(
            title="Test",
            issued_at=datetime.now(),
            customer=self._min_customer(),
            items=[self._min_item()],
            shipping_amount=Decimal("0"),
        )
        self.assertEqual(q.shipping_amount, Decimal("0"))

    def test_negative_shipping_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmit(
                title="Test",
                issued_at=datetime.now(),
                customer=self._min_customer(),
                items=[self._min_item()],
                shipping_amount=Decimal("-1"),
            )

    def test_customer_empty_name_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationCustomerInfo(name="")

    def test_customer_name_255_accepted(self) -> None:
        c = QuotationCustomerInfo(name="A" * 255)
        self.assertEqual(len(c.name), 255)

    def test_customer_name_256_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationCustomerInfo(name="A" * 256)

    def test_customer_address_512_accepted(self) -> None:
        c = QuotationCustomerInfo(name="Test", address="A" * 512)
        self.assertEqual(len(c.address), 512)

    def test_customer_address_513_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationCustomerInfo(name="Test", address="A" * 513)

    def test_reference_number_max_length_accepted(self) -> None:
        q = QuotationSubmit(
            title="Test",
            issued_at=datetime.now(),
            customer=self._min_customer(),
            items=[self._min_item()],
            reference_number="A" * 100,
        )
        self.assertEqual(len(q.reference_number), 100)

    def test_reference_number_too_long_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmit(
                title="Test",
                issued_at=datetime.now(),
                customer=self._min_customer(),
                items=[self._min_item()],
                reference_number="A" * 101,
            )

    def test_valid_until_before_issued_at_accepted(self) -> None:
        """valid_until can be before issued_at — schema allows it."""
        past = datetime.now() - timedelta(days=1)
        q = QuotationSubmit(
            title="Test",
            issued_at=datetime.now(),
            customer=self._min_customer(),
            items=[self._min_item()],
            valid_until=past,
        )
        self.assertEqual(q.valid_until, past)

    def test_large_quantity_accepted(self) -> None:
        item = QuotationSubmitItem(quantity=999999, unit_price=Decimal("10"))
        self.assertEqual(item.quantity, 999999)

    def test_item_hsn_code_validation(self) -> None:
        """HSN code in quotation items follows same rules."""
        item = QuotationSubmitItem(quantity=1, unit_price=Decimal("10"), hsn_code="12345678")
        self.assertEqual(item.hsn_code, "12345678")

    def test_item_hsn_code_invalid_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationSubmitItem(quantity=1, unit_price=Decimal("10"), hsn_code="1")


class PaymentStatusUpdateEdgeCaseTests(unittest.TestCase):
    """Edge cases for invoice payment status updates."""

    def test_paid_status_accepted(self) -> None:
        update = InvoicePaymentStatusUpdate(status="Paid")
        self.assertEqual(update.status, "Paid")

    def test_unpaid_status_accepted(self) -> None:
        update = InvoicePaymentStatusUpdate(status="Unpaid")
        self.assertEqual(update.status, "Unpaid")

    def test_lowercase_paid_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            InvoicePaymentStatusUpdate(status="paid")

    def test_partial_status_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            InvoicePaymentStatusUpdate(status="Partially Paid")

    def test_empty_status_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            InvoicePaymentStatusUpdate(status="")

    def test_overdue_status_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            InvoicePaymentStatusUpdate(status="Overdue")


class QuotationUpdateEdgeCaseTests(unittest.TestCase):
    """Edge cases for quotation update schema."""

    def test_update_with_no_fields(self) -> None:
        update = QuotationUpdate()
        self.assertIsNone(update.title)
        self.assertIsNone(update.items)

    def test_update_title_whitespace_only_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationUpdate(title="   ")

    def test_update_shipping_zero_accepted(self) -> None:
        update = QuotationUpdate(shipping_amount=Decimal("0"))
        self.assertEqual(update.shipping_amount, Decimal("0"))

    def test_update_negative_shipping_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            QuotationUpdate(shipping_amount=Decimal("-1"))

    def test_update_with_customer_info(self) -> None:
        update = QuotationUpdate(
            customer=QuotationCustomerInfo(name="Updated Customer")
        )
        self.assertEqual(update.customer.name, "Updated Customer")


if __name__ == "__main__":
    unittest.main()
