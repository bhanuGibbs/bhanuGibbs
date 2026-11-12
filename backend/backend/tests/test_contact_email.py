import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

from app.services.email_service import (
    EmailConfigurationError,
    EmailDeliveryError,
    EmailService,
)


def configured_settings(**overrides):
    values = {
        "environment": "development",
        "frontend_url": "http://localhost:3002",
        "smtp_host": "smtp.example.com",
        "smtp_port": 587,
        "smtp_username": "sender@example.com",
        "smtp_password": "provider-app-password",
        "smtp_from_email": "sender@example.com",
        "smtp_to_email": "admin@example.com",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class ContactAlertEmailTests(unittest.IsolatedAsyncioTestCase):
    """Test the contact form alert email feature."""

    def test_contact_alert_requires_smtp_to_email(self) -> None:
        """Missing smtp_to_email should raise EmailConfigurationError."""
        service = EmailService()
        service.settings = configured_settings(smtp_to_email="")

        with self.assertRaises(EmailConfigurationError):
            service.ensure_contact_alert_configured()

    def test_contact_alert_requires_smtp_host(self) -> None:
        """Missing smtp_host should raise EmailConfigurationError."""
        service = EmailService()
        service.settings = configured_settings(smtp_host="")

        with self.assertRaises(EmailConfigurationError):
            service.ensure_contact_alert_configured()

    def test_contact_alert_requires_smtp_password(self) -> None:
        """Missing smtp_password should raise EmailConfigurationError."""
        service = EmailService()
        service.settings = configured_settings(smtp_password="")

        with self.assertRaises(EmailConfigurationError):
            service.ensure_contact_alert_configured()

    def test_contact_alert_passes_when_all_configured(self) -> None:
        """All required fields present should not raise."""
        service = EmailService()
        service.settings = configured_settings()

        # Should not raise
        service.ensure_contact_alert_configured()

    async def test_contact_alert_email_is_sent_over_starttls(self) -> None:
        """Email should be sent via STARTTLS with correct content."""
        service = EmailService()
        service.settings = configured_settings()

        with patch("app.services.email_service.smtplib.SMTP") as smtp_factory:
            await service.send_contact_alert_email(
                sender_name="John Doe",
                sender_email="john@example.com",
                sender_mobile="+919876543210",
                message_text="I would like a demo.",
            )

        smtp = smtp_factory.return_value.__enter__.return_value
        smtp.starttls.assert_called_once()
        smtp.login.assert_called_once_with("sender@example.com", "provider-app-password")
        sent_message = smtp.send_message.call_args.args[0]

        self.assertEqual(sent_message["To"], "admin@example.com")
        self.assertEqual(sent_message["Subject"], "New contact form message from John Doe")
        self.assertIn("Name: John Doe", sent_message.get_content())
        self.assertIn("Email: john@example.com", sent_message.get_content())
        self.assertIn("Mobile: +919876543210", sent_message.get_content())
        self.assertIn("I would like a demo.", sent_message.get_content())
        self.assertIn("Reply to: john@example.com", sent_message.get_content())

    async def test_contact_alert_email_delivery_failure_raises(self) -> None:
        """SMTP delivery failure should raise EmailDeliveryError."""
        import smtplib as smtp_lib

        service = EmailService()
        service.settings = configured_settings()

        with patch("app.services.email_service.smtplib.SMTP") as smtp_factory:
            smtp_factory.return_value.__enter__.return_value.starttls.side_effect = (
                smtp_lib.SMTPException("Connection refused")
            )

            with self.assertRaises(EmailDeliveryError):
                await service.send_contact_alert_email(
                    sender_name="John Doe",
                    sender_email="john@example.com",
                    sender_mobile="+919876543210",
                    message_text="Test message",
                )


class ContactEndpointTests(unittest.IsolatedAsyncioTestCase):
    """Test the contact form endpoint integration with email."""

    async def test_submit_contact_sends_alert_email(self) -> None:
        """Successful submission should send alert email."""
        from app.schemas.contact import ContactForm

        email_service = Mock()
        email_service.send_contact_alert_email = AsyncMock()

        with patch("app.api.contact_router.EmailService", return_value=email_service):
            from app.api.contact_router import submit_contact
            from fastapi import Request

            request = Mock(spec=Request)
            payload = ContactForm(
                name="Jane Smith",
                email="jane@test.com",
                mobile="+919876543210",
                message="Hello!",
            )
            result = await submit_contact(request, payload)

        self.assertEqual(result["status"], "ok")
        email_service.send_contact_alert_email.assert_awaited_once_with(
            sender_name="Jane Smith",
            sender_email="jane@test.com",
            sender_mobile="+919876543210",
            message_text="Hello!",
        )

    async def test_submit_contact_gracefully_handles_email_not_configured(self) -> None:
        """Missing email config should not break the endpoint."""
        from app.schemas.contact import ContactForm

        email_service = Mock()
        email_service.send_contact_alert_email = AsyncMock(
            side_effect=EmailConfigurationError("Not configured")
        )

        with patch("app.api.contact_router.EmailService", return_value=email_service):
            from app.api.contact_router import submit_contact
            from fastapi import Request

            request = Mock(spec=Request)
            payload = ContactForm(
                name="Test User",
                email="test@test.com",
                mobile="+919876543210",
                message="Test",
            )
            result = await submit_contact(request, payload)

        # Should still return success even if email is not configured
        self.assertEqual(result["status"], "ok")

    async def test_submit_contact_gracefully_handles_delivery_failure(self) -> None:
        """Email delivery failure should not break the endpoint."""
        from app.schemas.contact import ContactForm

        email_service = Mock()
        email_service.send_contact_alert_email = AsyncMock(
            side_effect=EmailDeliveryError("SMTP error")
        )

        with patch("app.api.contact_router.EmailService", return_value=email_service):
            from app.api.contact_router import submit_contact
            from fastapi import Request

            request = Mock(spec=Request)
            payload = ContactForm(
                name="Test User",
                email="test@test.com",
                mobile="+919876543210",
                message="Test",
            )
            result = await submit_contact(request, payload)

        # Should still return success even if email delivery fails
        self.assertEqual(result["status"], "ok")


if __name__ == "__main__":
    unittest.main()
