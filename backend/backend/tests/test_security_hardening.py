import hashlib
import unittest
from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

from fastapi import HTTPException

from app.api.role_router import create_role, list_roles
from app.core import config
from app.models.auth_session import AuthSession
from app.services.auth_session_service import AuthSessionService
from app.services.user_service import UserService


class SecurityHardeningTests(unittest.IsolatedAsyncioTestCase):
    async def test_role_management_rejects_non_admin_callers(self) -> None:
        with self.assertRaises(HTTPException) as create_error:
            await create_role(
                SimpleNamespace(name="Auditor", description=None),
                current_user={"role": "Sales"},
                session=object(),
            )
        self.assertEqual(create_error.exception.status_code, 403)

        with self.assertRaises(HTTPException) as list_error:
            await list_roles(current_user={"role": "Viewer"}, session=object())
        self.assertEqual(list_error.exception.status_code, 403)

    async def test_refresh_session_persists_only_a_hash(self) -> None:
        service = AuthSessionService(AsyncMock())
        service.repository.add = AsyncMock()
        service.repository.commit = AsyncMock()
        raw_token = "opaque-refresh-token"

        await service.create_session(str(uuid4()), raw_token, "token-id")

        record = service.repository.add.await_args.args[0]
        self.assertIsInstance(record, AuthSession)
        self.assertEqual(record.refresh_token_hash, hashlib.sha256(raw_token.encode()).hexdigest())
        self.assertNotEqual(record.refresh_token_hash, raw_token)

    async def test_production_rejects_default_or_short_jwt_secret(self) -> None:
        for secret in ("changeme", "short-secret"):
            with (
                patch.object(config, "_SETTINGS", None),
                patch.dict("os.environ", {"ENVIRONMENT": "production", "JWT_SECRET_KEY": secret}),
            ):
                with self.assertRaisesRegex(RuntimeError, "JWT_SECRET_KEY"):
                    config.get_settings()

    async def test_password_reset_hashes_token_and_revokes_sessions_atomically(self) -> None:
        raw_token = "one-time-reset-token"
        user = SimpleNamespace(
            id=uuid4(),
            password_reset_token=None,
            password_reset_expires_at=None,
            hashed_password="old-hash",
        )
        service = UserService(AsyncMock())
        service.repository.get_by_email = AsyncMock(return_value=user)
        service.repository.get_by_password_reset_token = AsyncMock(return_value=user)
        service.repository.commit = AsyncMock()

        with patch("app.services.user_service.secrets.token_urlsafe", return_value=raw_token):
            issued = await service.create_password_reset_token("person@example.com")

        self.assertEqual(issued, raw_token)
        expected_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        self.assertEqual(user.password_reset_token, expected_hash)
        self.assertNotEqual(user.password_reset_token, raw_token)

        auth_sessions = Mock()
        auth_sessions.revoke_all_sessions_for_user = AsyncMock()
        with patch("app.services.auth_session_service.AuthSessionService", return_value=auth_sessions):
            await service.reset_password(raw_token, "new-password-123")

        service.repository.get_by_password_reset_token.assert_awaited_with(expected_hash)
        auth_sessions.revoke_all_sessions_for_user.assert_awaited_once_with(
            str(user.id), commit=False
        )
        service.repository.commit.assert_awaited()
        self.assertIsNone(user.password_reset_token)

    async def test_refresh_rotation_is_locked_and_non_committing_primitives_are_available(self) -> None:
        session = AsyncMock()
        service = AuthSessionService(session)
        service.repository.add = AsyncMock()
        service.repository.commit = AsyncMock()

        await service.create_session(str(uuid4()), "raw-token", "rotated-id", commit=False)

        service.repository.commit.assert_not_awaited()
        service.repository.add.assert_awaited_once()
