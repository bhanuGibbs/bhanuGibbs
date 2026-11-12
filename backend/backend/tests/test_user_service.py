import unittest
import uuid
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock

from sqlalchemy import event
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.models  # noqa: F401 - registers model tables and foreign-key targets
from app.core.database import Base
from app.models.audit_event import AuditEvent
from app.models.auth_session import AuthSession
from app.models.company import Company
from app.models.customer import Customer
from app.models.pos_category import POSCategory  # noqa: F401 - register related table
from app.models.pos_payment import POSPayment  # noqa: F401 - register related table
from app.models.pos_product import POSProduct  # noqa: F401 - register related table
from app.models.pos_product_variant import POSProductVariant  # noqa: F401 - register related table
from app.models.pos_return import POSReturn  # noqa: F401 - register related table
from app.models.pos_return_item import POSReturnItem  # noqa: F401 - register related table
from app.models.pos_stock_movement import POSStockMovement  # noqa: F401 - register related table
from app.models.pos_transaction import POSTransaction  # noqa: F401 - register related table
from app.models.pos_transaction_item import POSTransactionItem  # noqa: F401 - register related table
from app.models.product import Product
from app.models.quotation_finalization_usage import QuotationFinalizationUsage
from app.models.role import Role
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


class UserDeletionTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")

        @event.listens_for(self.engine.sync_engine, "connect")
        def enable_foreign_keys(connection, _record) -> None:
            cursor = connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        user_foreign_keys = [
            (constraint, constraint.ondelete)
            for table in Base.metadata.tables.values()
            for constraint in table.foreign_key_constraints
            if any(key.target_fullname == "users.id" for key in constraint.elements)
        ]
        for constraint, _ondelete in user_foreign_keys:
            constraint.ondelete = None
        try:
            async with self.engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
        finally:
            for constraint, ondelete in user_foreign_keys:
                constraint.ondelete = ondelete
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)
        self.session = self.session_factory()

    async def asyncTearDown(self) -> None:
        await self.session.close()
        await self.engine.dispose()

    async def test_delete_user_cleans_references_and_preserves_company_records(self) -> None:
        role = Role(name="Sales")
        company = Company(name="Deletion Test Company")
        self.session.add_all([role, company])
        await self.session.flush()

        user = User(
            username="deletion-test-user",
            email="deletion-test@example.com",
            hashed_password="not-a-real-password-hash",
            role_id=role.id,
            company_id=company.id,
        )
        self.session.add(user)
        await self.session.flush()

        customer = Customer(
            name="Retained Customer",
            company_id=company.id,
            created_by_id=user.id,
        )
        product = Product(
            name="Retained Product",
            price=Decimal("10.00"),
            company_id=company.id,
            created_by_id=user.id,
        )
        audit_event = AuditEvent(
            actor_user_id=user.id,
            resource_type="quotation",
            resource_id=uuid.uuid4(),
            action="created",
        )
        auth_session = AuthSession(
            user_id=user.id,
            refresh_token_hash="test-refresh-token-hash",
            token_id="test-token-id",
            expires_at=datetime.now(),
        )
        usage = QuotationFinalizationUsage(
            user_id=user.id,
            quotation_id=uuid.uuid4(),
            finalized_at=datetime.now(),
        )
        self.session.add_all([customer, product, audit_event, auth_session, usage])
        await self.session.commit()

        await UserService(self.session).delete_user(str(user.id))

        self.assertIsNone(await self.session.get(User, user.id))
        self.assertIsNone(await self.session.get(AuthSession, auth_session.id))
        self.assertIsNone(await self.session.get(QuotationFinalizationUsage, usage.id))
        await self.session.refresh(customer)
        await self.session.refresh(product)
        await self.session.refresh(audit_event)
        self.assertIsNone(customer.created_by_id)
        self.assertIsNone(product.created_by_id)
        self.assertIsNone(audit_event.actor_user_id)
