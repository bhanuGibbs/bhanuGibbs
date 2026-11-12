"""
Real SMTP integration test for the contact form email alert.
This test uses the actual SMTP configuration from .env to verify
the email is sent successfully.

WARNING: This test sends REAL emails. It is skipped by default during regular pytest runs.
To run it explicitly, use: pytest backend/tests/test_real_contact_email.py -v
"""
import asyncio
import unittest
import sys
from pathlib import Path

# Ensure the backend package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.email_service import EmailService, EmailConfigurationError, EmailDeliveryError


class RealContactEmailTest(unittest.IsolatedAsyncioTestCase):
    """Test contact alert email with real SMTP configuration. Skipped by default to avoid spamming emails."""

    @unittest.skip("Sends real emails — run manually only: pytest test_real_contact_email.py -v")
    async def test_real_smtp_contact_email_send(self) -> None:
        """Send a real contact alert email using configured SMTP settings."""
        service = EmailService()

        # Check if SMTP is configured
        try:
            service.ensure_contact_alert_configured()
        except EmailConfigurationError as e:
            print(f"\n⚠️  SMTP is not configured: {e}")
            print("Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_TO_EMAIL in .env")
            self.skipTest("SMTP not configured")

        print(f"\n📧 Testing real email send to: {service.settings.smtp_to_email}")
        print(f"   From: {service.settings.smtp_from_email}")
        print(f"   Server: {service.settings.smtp_host}:{service.settings.smtp_port}")

        try:
            await service.send_contact_alert_email(
                sender_name="Integration Test User",
                sender_email="test@example.com",
                sender_mobile="+919876543210",
                message_text="This is an automated test message from the contact form email integration test.",
            )
            print("✅ Email sent successfully! Check your inbox.")
        except EmailDeliveryError as e:
            print(f"❌ Email delivery failed: {e}")
            print("\nPossible causes:")
            print("  1. SMTP credentials are incorrect")
            print("  2. Gmail App Password is invalid or revoked")
            print("  3. Network connectivity issue to SMTP server")
            print("  4. Gmail 2FA is not enabled (required for App Passwords)")
            raise

    async def test_smtp_configuration_check(self) -> None:
        """Verify SMTP settings are properly loaded from .env."""
        from app.core.config import get_settings

        settings = get_settings()

        print(f"\n📋 Current SMTP Configuration:")
        print(f"   SMTP_HOST: {settings.smtp_host or '(not set)'}")
        print(f"   SMTP_PORT: {settings.smtp_port or '(not set)'}")
        print(f"   SMTP_USERNAME: {settings.smtp_username or '(not set)'}")
        print(f"   SMTP_PASSWORD: {'****' if settings.smtp_password else '(not set)'}")
        print(f"   SMTP_FROM_EMAIL: {settings.smtp_from_email or '(not set)'}")
        print(f"   SMTP_TO_EMAIL: {settings.smtp_to_email or '(not set)'}")

        service = EmailService()
        try:
            service.ensure_contact_alert_configured()
            print("✅ All required SMTP fields are configured")
        except EmailConfigurationError as e:
            print(f"❌ Missing configuration: {e}")
            raise


if __name__ == "__main__":
    unittest.main(verbosity=2)
