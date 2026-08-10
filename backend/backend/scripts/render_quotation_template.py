from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "app" / "templates"


def render_template(template_name: str, context: dict[str, object]) -> str:
    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template(template_name)
    return template.render(**context)


html = render_template(
    "quotation.html",
    {
        "quotation": {
            "reference_number": "Q-2026-001",
            "title": "Sample Quotation",
            "description": "Generated for template run test.",
            "issued_at": "2026-08-05",
            "total_amount": "1,234.56",
        },
        "company": {
            "name": "Example Co.",
            "address": "123 Example Street",
            "email": "info@example.com",
        },
        "customer": {
            "name": "Test Customer",
            "email": "customer@example.com",
        },
        "items": [
            {
                "product_name": "Service A",
                "quantity": 2,
                "unit_price": "100.00",
                "total_price": "200.00",
            },
            {
                "product_name": "Service B",
                "quantity": 1,
                "unit_price": "1,034.56",
                "total_price": "1,034.56",
            },
        ],
    },
)

output_path = Path(__file__).resolve().parent / "quotation_template_render.html"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Rendered HTML written to {output_path}")
