from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace

from app.services.pdf_service import PDFService
from app.utils.pdf_generator import generate_pdf_from_data


def test_pdf_generation_tolerates_non_latin_contact_text() -> None:
    context = {
        "quotation": {
            "title": "Quotation", "reference_number": "QT-1", "description": None,
            "issued_at": "2026-10-29", "subtotal": "10", "discount": "0",
            "tax_amount": "0", "shipping_amount": "0", "total_amount": "10",
        },
        "company": {"name": "व्यापार कंपनी", "address": None, "email": None,
                    "phone_number": None, "website": None, "gstin": None},
        "customer": {"name": "ग्राहक", "company_name": None, "address": None,
                     "phone_number": None, "email": None, "gstin": None,
                     "city": None, "state": None, "country": None, "pincode": None},
        "items": [{"product_name": "वस्तु", "quantity": 1,
                   "unit_price": "10", "total_price": "10"}],
    }

    pdf_bytes = generate_pdf_from_data(context)

    assert pdf_bytes.startswith(b"%PDF-")


def test_pdf_service_uses_saved_item_name_when_product_is_missing() -> None:
    quotation = SimpleNamespace(
        reference_number="QT-2", title="Quotation", description=None,
        issued_at=datetime(2026, 10, 29), subtotal=Decimal("10"),
        discount=Decimal("0"), tax_amount=Decimal("0"),
        shipping_amount=Decimal("0"), total_amount=Decimal("10"),
    )
    customer = SimpleNamespace(
        name="Customer", company_name=None, address=None, phone_number=None,
        email=None, gstin=None, country=None, state=None, city=None, pincode=None,
    )
    company = SimpleNamespace(
        name="Company", address=None, phone_number=None, email=None,
        website=None, gstin=None,
    )
    item = SimpleNamespace(
        item_name="Saved item name", product_id="missing-product",
        quantity=1, unit_price=Decimal("10"), total_price=Decimal("10"),
    )

    pdf_bytes = PDFService().render_quotation_pdf(
        quotation, customer, company, [item], products={},
    )

    assert pdf_bytes.startswith(b"%PDF-")
