from __future__ import annotations

import asyncio
import smtplib
import ssl
from email.message import EmailMessage
from urllib.parse import urlencode

from app.core.config import get_settings


class EmailConfigurationError(Exception):
    """Raised when password-reset email settings are incomplete or unsafe."""


class EmailDeliveryError(Exception):
    """Raised when the configured SMTP provider cannot deliver a message."""


class EmailService:
    """Send account emails through an authenticated STARTTLS SMTP server."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def ensure_password_reset_configured(self) -> None:
        required = (
            self.settings.smtp_host,
            self.settings.smtp_username,
            self.settings.smtp_password,
            self.settings.smtp_from_email,
            self.settings.frontend_url,
        )
        if not all(required):
            raise EmailConfigurationError("Password reset email is not configured.")

        if (
            self.settings.environment.lower() == "production"
            and not self.settings.frontend_url.startswith("https://")
        ):
            raise EmailConfigurationError(
                "Password reset links must use HTTPS in production."
            )

    def build_password_reset_url(self, token: str) -> str:
        self.ensure_password_reset_configured()
        return (
            f"{self.settings.frontend_url}/reset-password?"
            f"{urlencode({'token': token})}"
        )

    async def send_password_reset_email(self, recipient: str, token: str) -> None:
        self.ensure_password_reset_configured()
        reset_url = self.build_password_reset_url(token)
        message = EmailMessage()
        message["Subject"] = "Reset your KeelBill Ledger password"
        message["From"] = self.settings.smtp_from_email
        message["To"] = recipient
        message.set_content(
            "We received a request to reset your KeelBill Ledger password.\n\n"
            f"Use this link within one hour to choose a new password:\n{reset_url}\n\n"
            "If you did not request this, you can ignore this email."
        )

        try:
            await asyncio.to_thread(self._send_message, message)
        except (OSError, smtplib.SMTPException) as error:
            raise EmailDeliveryError("Password reset email could not be sent.") from error

    def _send_message(self, message: EmailMessage) -> None:
        with smtplib.SMTP(
            self.settings.smtp_host,
            self.settings.smtp_port,
            timeout=10,
        ) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
            server.login(self.settings.smtp_username, self.settings.smtp_password)
            server.send_message(message)
