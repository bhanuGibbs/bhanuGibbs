import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services.email_service import EmailConfigurationError, EmailService


def configured_settings(**overrides):
    values = {
        "environment": "development",
        "frontend_url": "http://localhost:3002",
        "smtp_host": "smtp.example.com",
        "smtp_port": 587,
        "smtp_username": "sender@example.com",
        "smtp_password": "provider-app-password",
        "smtp_from_email": "sender@example.com",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class EmailServiceTests(unittest.IsolatedAsyncioTestCase):
    def test_password_reset_url_encodes_token(self) -> None:
        service = EmailService()
        service.settings = configured_settings()

        url = service.build_password_reset_url("token+/with spaces")

        self.assertEqual(
            url,
            "http://localhost:3002/reset-password?token=token%2B%2Fwith+spaces",
        )

    def test_production_rejects_non_https_reset_url(self) -> None:
        service = EmailService()
        service.settings = configured_settings(environment="production")

        with self.assertRaises(EmailConfigurationError):
            service.ensure_password_reset_configured()

    def test_missing_smtp_credentials_are_rejected(self) -> None:
        service = EmailService()
        service.settings = configured_settings(smtp_password="")

        with self.assertRaises(EmailConfigurationError):
            service.ensure_password_reset_configured()

    async def test_password_reset_message_is_sent_over_starttls(self) -> None:
        service = EmailService()
        service.settings = configured_settings()

        with patch("app.services.email_service.smtplib.SMTP") as smtp_factory:
            await service.send_password_reset_email(
                "recipient@example.com",
                "one-time-token",
            )

        smtp = smtp_factory.return_value.__enter__.return_value
        smtp.starttls.assert_called_once()
        smtp.login.assert_called_once_with("sender@example.com", "provider-app-password")
        sent_message = smtp.send_message.call_args.args[0]
        self.assertEqual(sent_message["To"], "recipient@example.com")
        self.assertIn(
            "http://localhost:3002/reset-password?token=one-time-token",
            sent_message.get_content(),
        )
