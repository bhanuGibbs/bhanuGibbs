import unittest
import uuid
from unittest.mock import AsyncMock

from app.models.user import User
from app.schemas.user import UserProfileUpdate
from app.services.exceptions import ConflictError
from app.services.user_service import UserService


class UserProfileUpdateTests(unittest.IsolatedAsyncioTestCase):
    async def test_profile_update_changes_only_submitted_contact_fields(self) -> None:
        role_id = uuid.uuid4()
        user = User(
            id=uuid.uuid4(),
            username="old-name",
            email="old@example.com",
            mobile_number=None,
            hashed_password="hash",
            role_id=role_id,
            is_superuser=False,
        )
        service = UserService(AsyncMock())
        service.repository.get = AsyncMock(return_value=user)
        service.repository.get_by_username = AsyncMock(return_value=None)
        service.repository.get_by_email = AsyncMock(return_value=None)
        service.repository.commit = AsyncMock()
        payload = UserProfileUpdate(
            username="new-name",
            email="new@example.com",
            mobile_number="5550100000",
            role="Super Admin",
            is_superuser=True,
        )

        await service.update_profile(str(user.id), payload.model_dump(exclude_unset=True))

        self.assertEqual(user.username, "new-name")
        self.assertEqual(user.email, "new@example.com")
        self.assertEqual(user.mobile_number, "5550100000")
        self.assertEqual(user.role_id, role_id)
        self.assertFalse(user.is_superuser)
        service.repository.commit.assert_awaited_once()

    async def test_profile_update_rejects_another_users_username(self) -> None:
        user = User(
            id=uuid.uuid4(),
            username="current",
            email="current@example.com",
            hashed_password="hash",
            role_id=uuid.uuid4(),
        )
        another_user = User(
            id=uuid.uuid4(),
            username="taken",
            email="other@example.com",
            hashed_password="hash",
            role_id=uuid.uuid4(),
        )
        service = UserService(AsyncMock())
        service.repository.get = AsyncMock(return_value=user)
        service.repository.get_by_username = AsyncMock(return_value=another_user)
        service.repository.commit = AsyncMock()

        with self.assertRaises(ConflictError):
            await service.update_profile(str(user.id), {"username": "taken"})

        service.repository.commit.assert_not_awaited()

    def test_profile_schema_discards_role_escalation_fields(self) -> None:
        payload = UserProfileUpdate(
            username="valid-user",
            email="valid@example.com",
            role="Admin",
            is_superuser=True,
        )

        self.assertEqual(set(payload.model_dump()), {"username", "email", "mobile_number"})
