from pathlib import Path
import webbrowser

from jinja2 import Environment, FileSystemLoader, select_autoescape

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR.parent / "app" / "templates"
OUTPUT_FILE = BASE_DIR / "quotation_template_render.html"


def render_template(template_name: str, context: dict[str, object]) -> str:
    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template(template_name)
    return template.render(**context)


def ensure_rendered_html() -> Path:
    if OUTPUT_FILE.exists():
        return OUTPUT_FILE

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

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(html)

    return OUTPUT_FILE


if __name__ == "__main__":
    rendered_path = ensure_rendered_html()
    url = rendered_path.resolve().as_uri()
    print(f"Opening rendered quotation page: {rendered_path}")
    webbrowser.open_new_tab(url)
