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
                "subtotal": str(quotation.subtotal),
                "discount": str(quotation.discount),
                "tax_amount": str(quotation.tax_amount),
                "shipping_amount": str(quotation.shipping_amount),
                "total_amount": str(quotation.total_amount),
            },
            "company": {
                "name": company.name,
                "address": company.address,
                "phone_number": company.phone_number,
                "email": company.email,
                "website": company.website,
                "gstin": company.gstin,
            },
            "customer": {
                "name": customer.name,
                "company_name": customer.company_name,
                "address": customer.address,
                "phone_number": customer.phone_number,
                "email": customer.email,
                "gstin": customer.gstin,
                "country": customer.country,
                "state": customer.state,
                "city": customer.city,
                "pincode": customer.pincode,
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
