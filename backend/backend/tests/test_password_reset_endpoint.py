import unittest
from unittest.mock import AsyncMock, Mock, patch

from fastapi import HTTPException

from app.api.auth_router import forgot_password
from app.schemas.user import ForgotPasswordRequest
from app.services.email_service import EmailConfigurationError, EmailDeliveryError
from app.services.exceptions import NotFoundError


class ForgotPasswordEndpointTests(unittest.IsolatedAsyncioTestCase):
    async def test_password_reset_token_is_sent_by_email_not_returned(self) -> None:
        service = AsyncMock()
        service.create_password_reset_token.return_value = "one-time-token"
        email_service = Mock()
        email_service.send_password_reset_email = AsyncMock()

        with (
            patch("app.api.auth_router.UserService", return_value=service),
            patch("app.api.auth_router.EmailService", return_value=email_service),
        ):
            result = await forgot_password(
                ForgotPasswordRequest(email="user@example.com"),
                session=object(),
            )

        self.assertNotIn("reset_token", result)
        self.assertNotIn("one-time-token", str(result))
        email_service.send_password_reset_email.assert_awaited_once_with(
            "user@example.com",
            "one-time-token",
        )

    async def test_unknown_account_receives_generic_response(self) -> None:
        service = AsyncMock()
        service.create_password_reset_token.side_effect = NotFoundError()
        email_service = Mock()
        email_service.send_password_reset_email = AsyncMock()

        with (
            patch("app.api.auth_router.UserService", return_value=service),
            patch("app.api.auth_router.EmailService", return_value=email_service),
        ):
            result = await forgot_password(
                ForgotPasswordRequest(email="unknown@example.com"),
                session=object(),
            )

        self.assertNotIn("reset_token", result)
        email_service.send_password_reset_email.assert_not_awaited()

    async def test_unconfigured_provider_returns_service_unavailable(self) -> None:
        email_service = Mock()
        email_service.ensure_password_reset_configured.side_effect = (
            EmailConfigurationError("Email is not configured.")
        )

        with (
            patch("app.api.auth_router.EmailService", return_value=email_service),
            patch("app.api.auth_router.UserService") as user_service,
        ):
            with self.assertRaises(HTTPException) as raised:
                await forgot_password(
                    ForgotPasswordRequest(email="user@example.com"),
                    session=object(),
                )

        self.assertEqual(raised.exception.status_code, 503)
        user_service.assert_not_called()

    async def test_failed_delivery_invalidates_reset_token(self) -> None:
        service = AsyncMock()
        service.create_password_reset_token.return_value = "one-time-token"
        email_service = Mock()
        email_service.send_password_reset_email = AsyncMock()
        email_service.send_password_reset_email.side_effect = EmailDeliveryError()

        with (
            patch("app.api.auth_router.UserService", return_value=service),
            patch("app.api.auth_router.EmailService", return_value=email_service),
        ):
            result = await forgot_password(
                ForgotPasswordRequest(email="user@example.com"),
                session=object(),
            )

        service.invalidate_password_reset_token.assert_awaited_once_with(
            "one-time-token"
        )
        self.assertNotIn("reset_token", result)
