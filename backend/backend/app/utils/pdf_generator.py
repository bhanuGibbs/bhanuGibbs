from __future__ import annotations

from pathlib import Path
from typing import Any

from fpdf import FPDF
from jinja2 import Environment, FileSystemLoader, select_autoescape


TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"


def render_template(template_name: str, context: dict[str, Any]) -> str:
    """Render a Jinja2 template with the provided context."""
    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template(template_name)
    return template.render(**context)


def generate_pdf_from_data(context: dict[str, Any]) -> bytes:
    """Generate a PDF binary from quotation data."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Arial", "B", 16)
    document_label = "Invoice" if context["quotation"]["title"].lower() == "billing" else "Quotation"
    pdf.cell(0, 10, f"{document_label} {context['quotation']['reference_number']}", ln=True)
    pdf.ln(4)

    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, f"{document_label} Details", ln=True)
    pdf.set_font("Arial", size=11)
    pdf.cell(0, 8, f"Title: {context['quotation']['title']}", ln=True)
    if context['quotation'].get('description'):
        pdf.multi_cell(0, 8, f"Description: {context['quotation']['description']}")
    pdf.cell(0, 8, f"Issued at: {context['quotation']['issued_at']}", ln=True)
    pdf.ln(4)

    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Company", ln=True)
    pdf.set_font("Arial", size=11)
    pdf.cell(0, 8, f"{context['company']['name']}", ln=True)
    if context['company'].get('address'):
        pdf.cell(0, 8, f"{context['company']['address']}", ln=True)
    if context['company'].get('email'):
        pdf.cell(0, 8, f"{context['company']['email']}", ln=True)
    if context['company'].get('phone_number'):
        pdf.cell(0, 8, f"{context['company']['phone_number']}", ln=True)
    if context['company'].get('website'):
        pdf.cell(0, 8, f"{context['company']['website']}", ln=True)
    if context['company'].get('gstin'):
        pdf.cell(0, 8, f"GSTIN: {context['company']['gstin']}", ln=True)
    pdf.ln(4)

    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Customer", ln=True)
    pdf.set_font("Arial", size=11)
    pdf.cell(0, 8, f"{context['customer']['name']}", ln=True)
    if context['customer'].get('company_name'):
        pdf.cell(0, 8, f"{context['customer']['company_name']}", ln=True)
    if context['customer'].get('address'):
        pdf.multi_cell(0, 8, f"{context['customer']['address']}")
    if context['customer'].get('phone_number'):
        pdf.cell(0, 8, f"{context['customer']['phone_number']}", ln=True)
    if context['customer'].get('email'):
        pdf.cell(0, 8, f"{context['customer']['email']}", ln=True)
    if context['customer'].get('gstin'):
        pdf.cell(0, 8, f"GSTIN: {context['customer']['gstin']}", ln=True)
    customer_location = ", ".join(
        str(context["customer"][field])
        for field in ("city", "state", "country", "pincode")
        if context["customer"].get(field)
    )
    if customer_location:
        pdf.cell(0, 8, customer_location, ln=True)
    pdf.ln(6)

    pdf.set_font("Arial", "B", 12)
    pdf.cell(70, 8, "Product", border=1)
    pdf.cell(30, 8, "Qty", border=1, align="C")
    pdf.cell(40, 8, "Unit Price", border=1, align="R")
    pdf.cell(40, 8, "Total", border=1, align="R")
    pdf.ln()

    pdf.set_font("Arial", size=11)
    for item in context["items"]:
        pdf.cell(70, 8, str(item["product_name"]), border=1)
        pdf.cell(30, 8, str(item["quantity"]), border=1, align="C")
        pdf.cell(40, 8, str(item["unit_price"]), border=1, align="R")
        pdf.cell(40, 8, str(item["total_price"]), border=1, align="R")
        pdf.ln()

    pdf.ln(4)
    pdf.set_font("Arial", "B", 12)
    if context["quotation"].get("subtotal") is not None:
        pdf.cell(0, 7, f"Subtotal: {context['quotation']['subtotal']}", ln=True, align="R")
        pdf.cell(0, 7, f"Discount: -{context['quotation']['discount']}", ln=True, align="R")
        pdf.cell(0, 7, f"Tax: {context['quotation']['tax_amount']}", ln=True, align="R")
        pdf.cell(0, 7, f"Shipping: {context['quotation']['shipping_amount']}", ln=True, align="R")
    pdf.cell(0, 8, f"Grand Total: {context['quotation']['total_amount']}", ln=True, align="R")

    return bytes(pdf.output(dest="S"))
