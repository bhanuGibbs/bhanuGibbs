import unittest
from datetime import date, timedelta

from pydantic import TypeAdapter, ValidationError

from app.schemas.contact_fields import PhoneNumber, Pincode
from app.schemas.quotation import QuotationSubmit


class OptionalContactFieldTests(unittest.TestCase):
    def test_optional_phone_and_pincode_accept_null_and_blank(self) -> None:
        for field_type in (PhoneNumber, Pincode):
            adapter = TypeAdapter(field_type)
            self.assertIsNone(adapter.validate_python(None))
            self.assertIsNone(adapter.validate_python(""))

    def test_phone_and_pincode_still_require_exact_lengths(self) -> None:
        for value in ("123", "12345678901"):
            with self.assertRaises(ValidationError):
                TypeAdapter(PhoneNumber).validate_python(value)
        for value in ("12345", "1234567"):
            with self.assertRaises(ValidationError):
                TypeAdapter(Pincode).validate_python(value)

    def test_quotation_payload_accepts_empty_optional_contact_fields(self) -> None:
        today = date.today()
        payload = {
            "reference_number": None,
            "title": "Quotation",
            "issued_at": today.isoformat(),
            "valid_until": (today + timedelta(days=15)).isoformat(),
            "customer": {
                "name": "Customer",
                "phone_number": None,
                "pincode": None,
            },
            "items": [
                {"product_name": "Item", "quantity": 1, "unit_price": 10}
            ],
        }

        quotation = QuotationSubmit.model_validate(payload)

        self.assertIsNone(quotation.customer.phone_number)
        self.assertIsNone(quotation.customer.pincode)
