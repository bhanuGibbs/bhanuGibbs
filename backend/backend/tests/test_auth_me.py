import unittest
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.api.auth_router import read_current_user


class AuthMeTests(unittest.IsolatedAsyncioTestCase):
    async def test_super_admin_without_company_can_read_profile(self) -> None:
        user = SimpleNamespace(
            id="4a878141-4bcf-42e5-a57c-6184c9ba54d1",
            username="super-admin",
            email="admin@example.com",
            mobile_number=None,
            is_active=True,
            is_superuser=True,
            role_id="6a37cc0f-6be4-4a80-9f62-5b6418103dd2",
            company_id=None,
            is_profile_complete=True,
            subscription_plan="free",
            is_email_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        service = SimpleNamespace(get_user_by_id=AsyncMock(return_value=user))
        session = SimpleNamespace(get=AsyncMock(return_value=SimpleNamespace(name="Super Admin")))

        with patch("app.api.auth_router.UserService", return_value=service):
            profile = await read_current_user({"id": str(user.id)}, session)

        self.assertIsNone(profile.company_logo_data)
        self.assertIsNone(profile.company_seal_data)


if __name__ == "__main__":
    unittest.main()
