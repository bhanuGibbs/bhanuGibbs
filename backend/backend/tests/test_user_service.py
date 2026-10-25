import unittest
import uuid
from unittest.mock import AsyncMock

from app.models.user import User
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
