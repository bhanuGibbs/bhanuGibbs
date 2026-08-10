from __future__ import annotations

from app.models.customer import Customer
from app.models.company import Company
from app.models.quotation import Quotation
from app.models.quotation_item import QuotationItem
from app.models.product import Product
from app.utils.pdf_generator import generate_pdf_from_data


class PDFService:
    """Service layer for PDF generation."""

    def render_quotation_pdf(
        self,
        quotation: Quotation,
        customer: Customer,
        company: Company,
        items: list[QuotationItem],
        products: dict[str, Product],
    ) -> bytes:
        """Render a quotation PDF from the quotation data."""
        context = {
            "quotation": {
                "reference_number": quotation.reference_number,
                "title": quotation.title,
                "description": quotation.description,
                "issued_at": quotation.issued_at.isoformat(),
                "total_amount": str(quotation.total_amount),
            },
            "company": {
                "name": company.name,
                "address": company.address,
                "email": company.email,
            },
            "customer": {
                "name": customer.name,
                "email": customer.email,
            },
            "items": [
                {
                    "product_name": products[str(item.product_id)].name,
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                    "total_price": str(item.total_price),
                }
                for item in items
            ],
        }
        return generate_pdf_from_data(context)
