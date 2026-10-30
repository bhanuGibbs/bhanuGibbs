import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock

from app.models.user import User
from app.services.exceptions import NotFoundError
from app.services.user_service import UserService


class UserServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_get_user_by_id_converts_string_to_uuid(self) -> None:
        session = AsyncMock()
        expected_user = object()
        session.get.return_value = expected_user
        service = UserService(session)
        user_id = "b9f953ad-49d7-4661-90de-cf475496405d"

        result = await service.get_user_by_id(user_id)

        self.assertIs(result, expected_user)
        session.get.assert_awaited_once_with(User, uuid.UUID(user_id))

    async def test_get_user_by_id_returns_none_for_invalid_uuid(self) -> None:
        session = AsyncMock()
        service = UserService(session)

        result = await service.get_user_by_id("invalid")

        self.assertIsNone(result)
        session.get.assert_not_awaited()

    async def test_update_subscription_plan_locks_and_refreshes_user(self) -> None:
        session = AsyncMock()
        user = SimpleNamespace(subscription_plan="free")
        service = UserService(session)
        service.repository.get_for_update = AsyncMock(return_value=user)
        service.repository.commit = AsyncMock()

        result = await service.update_subscription_plan(
            "b9f953ad-49d7-4661-90de-cf475496405d", "premium"
        )

        self.assertIs(result, user)
        self.assertEqual(user.subscription_plan, "premium")
        service.repository.get_for_update.assert_awaited_once()
        service.repository.commit.assert_awaited_once()
        session.refresh.assert_awaited_once_with(user)

    async def test_user_plan_updates_are_company_scoped_for_admins(self) -> None:
        session = AsyncMock()
        user = SimpleNamespace(company_id=uuid.uuid4(), subscription_plan="free")
        service = UserService(session)
        service.repository.get_for_update = AsyncMock(return_value=user)
        service.repository.commit = AsyncMock()

        with self.assertRaises(NotFoundError):
            await service.update_subscription_plan(
                str(uuid.uuid4()), "premium", company_id=str(uuid.uuid4())
            )

        service.repository.commit.assert_not_awaited()

    async def test_user_lists_use_requested_company_scope(self) -> None:
        service = UserService(AsyncMock())
        service.repository.list_by_company = AsyncMock(return_value=[])
        service.repository.list_users = AsyncMock(return_value=[])

        self.assertEqual(await service.list_users("company-id"), [])
        service.repository.list_by_company.assert_awaited_once_with("company-id")
        service.repository.list_users.assert_not_awaited()
