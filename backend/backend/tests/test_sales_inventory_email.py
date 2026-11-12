from __future__ import annotations

from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from app.services.email_service import (
    EmailConfigurationError,
    EmailDeliveryError,
    EmailService,
)


class SalesInventoryEmailTests(IsolatedAsyncioTestCase):
    async def test_sales_order_alert_contains_order_summary(self) -> None:
        service = EmailService()
        with (
            patch.object(service, "ensure_smtp_configured"),
            patch.object(service, "_send_message") as send_message,
            patch.object(service.settings, "smtp_from_email", "alerts@example.com"),
        ):
            await service.send_sales_order_alert_email(
                recipient="admin@example.com",
                order_number="SO-123",
                dealer_name="Dealer One",
                sales_rep_name="Sales Rep",
                total_amount="125.00",
                items=[
                    {
                        "product_name": "Seed One",
                        "quantity": "5.000",
                        "unit": "bag",
                    }
                ],
            )

        send_message.assert_called_once()
        message = send_message.call_args.args[0]
        self.assertEqual(message["To"], "admin@example.com")
        self.assertEqual(message["Subject"], "Order SO-123 needs approval")
        body = message.get_content()
        self.assertIn("Dealer: Dealer One", body)
        self.assertIn("Submitted by: Sales Rep", body)
        self.assertIn("- Seed One: 5.000 bag", body)

    async def test_sales_order_alert_wraps_smtp_delivery_errors(self) -> None:
        service = EmailService()
        with (
            patch.object(service, "ensure_smtp_configured"),
            patch.object(service, "_send_message", side_effect=OSError("SMTP unavailable")),
            patch.object(service.settings, "smtp_from_email", "alerts@example.com"),
        ):
            with self.assertRaises(EmailDeliveryError):
                await service.send_sales_order_alert_email(
                    recipient="admin@example.com",
                    order_number="SO-123",
                    dealer_name="Dealer One",
                    sales_rep_name="Sales Rep",
                    total_amount="125.00",
                    items=[],
                )

    def test_sales_order_alert_requires_smtp_configuration(self) -> None:
        service = EmailService()
        with (
            patch.object(service.settings, "smtp_host", ""),
            patch.object(service.settings, "smtp_username", ""),
            patch.object(service.settings, "smtp_password", ""),
            patch.object(service.settings, "smtp_from_email", ""),
        ):
            with self.assertRaises(EmailConfigurationError):
                service.ensure_smtp_configured()
