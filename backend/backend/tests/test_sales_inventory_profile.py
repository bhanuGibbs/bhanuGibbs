from types import SimpleNamespace
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from pydantic import ValidationError

from app.api.auth_router import setup_company
from app.api.user_router import update_user_role
from app.dependencies import require_business_profile
from app.schemas.company import CompanyCreate
from app.schemas.user import UserRegister, UserRoleUpdate
from app.services.company_service import CompanyService
from app.services.exceptions import ConflictError


class SalesInventoryProfileSchemaTests(IsolatedAsyncioTestCase):
    def test_registration_accepts_sales_inventory_profile(self) -> None:
        user = UserRegister(
            username="sales-rep",
            email="rep@example.com",
            password="SecurePass1!",
            business_profile="sales_inventory",
        )
        self.assertEqual(user.business_profile, "sales_inventory")

    def test_registration_defaults_to_existing_invoice_profile(self) -> None:
        user = UserRegister(
            username="billing-user",
            email="billing@example.com",
            password="SecurePass1!",
        )
        self.assertEqual(user.business_profile, "invoice")

    def test_company_setup_accepts_sales_inventory_profile(self) -> None:
        company = CompanyCreate(name="Example Organization", business_profile="sales_inventory")
        self.assertEqual(company.business_profile, "sales_inventory")

    async def test_same_name_is_allowed_for_a_separate_sales_inventory_organization(self) -> None:
        service = CompanyService(AsyncMock())
        service.repository.get_by_name = AsyncMock(return_value=SimpleNamespace(name="Example Organization"))
        service.repository.add = AsyncMock()

        company = await service.create_company(
            name="Example Organization",
            business_profile="sales_inventory",
            commit=False,
        )

        self.assertEqual(company.name, "Example Organization")
        service.repository.add.assert_awaited_once_with(company)

    async def test_legacy_profile_company_name_conflicts_are_preserved(self) -> None:
        service = CompanyService(AsyncMock())
        service.repository.get_by_name = AsyncMock(return_value=SimpleNamespace(name="Example Organization"))

        with self.assertRaises(ConflictError):
            await service.create_company(
                name="Example Organization",
                business_profile="invoice",
                commit=False,
            )

    def test_registration_rejects_unknown_profile(self) -> None:
        with self.assertRaises(ValidationError):
            UserRegister(
                username="other-user",
                email="other@example.com",
                password="SecurePass1!",
                business_profile="unknown",
            )

    async def test_sales_inventory_profile_cannot_call_legacy_profile_api(self) -> None:
        require_invoice_profile = require_business_profile("invoice")
        with self.assertRaises(HTTPException) as raised:
            await require_invoice_profile(current_user={"business_profile": "sales_inventory"})
        self.assertEqual(raised.exception.status_code, 403)

    async def test_sales_inventory_role_cannot_be_changed_to_other_role(self) -> None:
        company_id = "4a878141-4bcf-42e5-a57c-6184c9ba54d1"
        target_user = SimpleNamespace(
            id="4a878141-4bcf-42e5-a57c-6184c9ba54d2",
            company_id=company_id,
            business_profile="sales_inventory",
        )
        service = SimpleNamespace(
            get_user_by_id=AsyncMock(return_value=target_user),
            update_user_role=AsyncMock(),
        )
        session = SimpleNamespace(
            get=AsyncMock(return_value=SimpleNamespace(business_profile="sales_inventory"))
        )

        with patch("app.api.user_router.UserService", return_value=service):
            with self.assertRaises(HTTPException) as raised:
                await update_user_role(
                    user_id=str(target_user.id),
                    payload=UserRoleUpdate(role_name="Super Admin"),
                    current_user={"role": "Admin", "company_id": company_id},
                    session=session,
                )

        self.assertEqual(raised.exception.status_code, 422)
        service.update_user_role.assert_not_awaited()

    async def test_organization_setup_does_not_lookup_or_join_by_name(self) -> None:
        admin_role = SimpleNamespace(id="admin-role", name="Admin")
        sales_role = SimpleNamespace(id="sales-role", name="Sales")
        user = SimpleNamespace(
            id="new-user",
            role_id=sales_role.id,
            business_profile="sales_inventory",
            is_profile_complete=False,
            company_id=None,
        )
        company = SimpleNamespace(
            id="4a878141-4bcf-42e5-a57c-6184c9ba54d3",
            name="Example Organization",
            address=None,
            phone_number=None,
            email=None,
            website=None,
            gstin=None,
            country=None,
            state=None,
            city=None,
            pincode=None,
            business_profile="sales_inventory",
            created_at="2026-01-01T00:00:00",
            updated_at="2026-01-01T00:00:00",
        )
        company_service = SimpleNamespace(
            get_company_by_name=AsyncMock(),
            create_company=AsyncMock(return_value=company),
        )
        session = SimpleNamespace(
            get=AsyncMock(return_value=sales_role),
            commit=AsyncMock(),
        )

        with (
            patch("app.api.auth_router.UserService") as user_service_class,
            patch("app.api.auth_router.CompanyService", return_value=company_service),
            patch(
                "app.api.auth_router.RoleRepository",
                return_value=SimpleNamespace(get_by_name=AsyncMock(return_value=admin_role)),
            ),
        ):
            user_service_class.return_value.get_user_by_id = AsyncMock(return_value=user)
            result = await setup_company(
                payload=CompanyCreate(
                    name="Example Organization",
                    business_profile="sales_inventory",
                ),
                current_user={"id": user.id},
                session=session,
            )

        company_service.get_company_by_name.assert_not_awaited()
        company_service.create_company.assert_awaited_once()
        self.assertEqual(user.company_id, company.id)
        self.assertEqual(user.role_id, admin_role.id)
        self.assertEqual(result.business_profile, "sales_inventory")

    async def test_sales_inventory_profile_cannot_be_changed_during_setup(self) -> None:
        user = SimpleNamespace(
            id="new-user",
            business_profile="sales_inventory",
            is_profile_complete=False,
        )
        user_service = SimpleNamespace(get_user_by_id=AsyncMock(return_value=user))
        session = SimpleNamespace()

        with (
            patch("app.api.auth_router.UserService", return_value=user_service),
            patch("app.api.auth_router.CompanyService"),
        ):
            with self.assertRaises(HTTPException) as raised:
                await setup_company(
                    payload=CompanyCreate(name="Example Organization", business_profile="invoice"),
                    current_user={"id": user.id},
                    session=session,
                )

        self.assertEqual(raised.exception.status_code, 409)

    async def test_legacy_setup_still_joins_its_matching_profile(self) -> None:
        company_id = "4a878141-4bcf-42e5-a57c-6184c9ba54d3"
        user = SimpleNamespace(
            id="existing-user",
            business_profile="invoice",
            is_profile_complete=False,
            company_id=None,
        )
        company = SimpleNamespace(
            id=company_id,
            name="Example Organization",
            address=None,
            phone_number=None,
            email=None,
            website=None,
            gstin=None,
            country=None,
            state=None,
            city=None,
            pincode=None,
            business_profile="invoice",
            created_at="2026-01-01T00:00:00",
            updated_at="2026-01-01T00:00:00",
        )
        company_service = SimpleNamespace(
            get_company_by_name=AsyncMock(return_value=company)
        )
        user_service = SimpleNamespace(get_user_by_id=AsyncMock(return_value=user))
        session = SimpleNamespace(commit=AsyncMock())

        with (
            patch("app.api.auth_router.UserService", return_value=user_service),
            patch("app.api.auth_router.CompanyService", return_value=company_service),
        ):
            result = await setup_company(
                payload=CompanyCreate(name=company.name, business_profile="invoice"),
                current_user={"id": user.id},
                session=session,
            )

        company_service.get_company_by_name.assert_awaited_once_with(
            company.name,
            business_profile="invoice",
        )
        self.assertEqual(user.company_id, company_id)
        self.assertEqual(result.business_profile, "invoice")
