import unittest
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

from app.services.exceptions import BadRequestError, MonthlyQuotationLimitError
from app.services.quotation_service import (
    MONTHLY_FINALIZATION_LIMITS,
    QuotationService,
    _database_datetime,
)
from app.core.exceptions import map_exception_to_http


class MonthlyQuotationLimitTests(unittest.IsolatedAsyncioTestCase):
    def test_timezone_aware_dates_are_normalized_to_utc_for_database(self) -> None:
        value = _database_datetime("2026-10-27T12:30:00+05:30")

        self.assertEqual(value, datetime(2026, 10, 27, 7, 0))

    def setUp(self) -> None:
        self.user_id = str(uuid4())
        self.company_id = str(uuid4())
        self.quotation = SimpleNamespace(
            id=uuid4(),
            company_id=self.company_id,
            created_by_id=self.user_id,
            issued_at=datetime(2026, 10, 27),
            title="Quotation",
            status="Draft",
            finalized_at=None,
            quotation_number=None,
            quotation_year=None,
        )
        self.service = QuotationService(AsyncMock())
        self.service.repository.get = AsyncMock(return_value=self.quotation)
        self.service.repository.lock_user_for_finalization = AsyncMock(return_value="free")
        self.service.repository.count_finalized_by_user_between = AsyncMock(return_value=9)
        self.service.repository.record_finalization = AsyncMock()
        self.service.repository.commit = AsyncMock()
        self.service.repository.session.refresh = AsyncMock()
        self.service.company_repository.get = AsyncMock(
            return_value=SimpleNamespace(quotation_prefix="QT")
        )
        self.service.daily_sequence_repository.next_number = AsyncMock(return_value=1)
        self.service._refresh_quotation = AsyncMock(return_value=self.quotation)

    async def test_finalizes_tenth_quotation_and_sets_finalized_timestamp(self) -> None:
        result = await self.service.finalize_quotation(
            str(self.quotation.id), self.company_id, self.user_id
        )

        self.assertIs(result, self.quotation)
        self.assertEqual(self.quotation.status, "Final")
        self.assertIsNotNone(self.quotation.finalized_at)
        self.assertEqual(self.quotation.quotation_number, "QT-27102026-001")
        self.service.repository.lock_user_for_finalization.assert_awaited_once_with(
            self.user_id
        )
        self.service.repository.count_finalized_by_user_between.assert_awaited_once()
        self.service.repository.record_finalization.assert_awaited_once()
        self.service.repository.commit.assert_awaited_once()

    async def test_rejects_finalized_quotation_at_plan_limit(self) -> None:
        self.service.repository.count_finalized_by_user_between.return_value = 10

        with self.assertRaisesRegex(
            MonthlyQuotationLimitError, "Monthly limit of 10 finalized quotations/invoices"
        ):
            await self.service.finalize_quotation(
                str(self.quotation.id), self.company_id, self.user_id
            )

        self.assertEqual(self.quotation.status, "Draft")
        self.assertIsNone(self.quotation.finalized_at)
        self.service.daily_sequence_repository.next_number.assert_not_awaited()
        self.service.repository.record_finalization.assert_not_awaited()
        self.service.repository.commit.assert_not_awaited()

    async def test_basic_plan_allows_fifty_and_rejects_fifty_first(self) -> None:
        self.service.repository.lock_user_for_finalization.return_value = "basic"
        self.service.repository.count_finalized_by_user_between.return_value = 49

        await self.service.finalize_quotation(
            str(self.quotation.id), self.company_id, self.user_id
        )

        self.assertEqual(MONTHLY_FINALIZATION_LIMITS["basic"], 50)

        self.quotation.finalized_at = None
        self.quotation.status = "Draft"
        self.service.repository.count_finalized_by_user_between.return_value = 50
        self.service.repository.commit.reset_mock()
        with self.assertRaisesRegex(
            MonthlyQuotationLimitError, "Monthly limit of 50 finalized quotations/invoices"
        ):
            await self.service.finalize_quotation(
                str(self.quotation.id), self.company_id, self.user_id
            )
        self.assertEqual(self.quotation.status, "Draft")
        self.service.repository.commit.assert_not_awaited()

    async def test_premium_plan_has_no_monthly_limit(self) -> None:
        self.service.repository.lock_user_for_finalization.return_value = "premium"

        await self.service.finalize_quotation(
            str(self.quotation.id), self.company_id, self.user_id
        )

        self.assertIsNone(MONTHLY_FINALIZATION_LIMITS["premium"])
        self.service.repository.count_finalized_by_user_between.assert_not_awaited()
        self.service.repository.record_finalization.assert_awaited_once()

    async def test_does_not_consume_quota_again_when_finalizing_existing_final(self) -> None:
        self.quotation.status = "Final"
        self.quotation.finalized_at = datetime(2026, 10, 1)
        self.quotation.quotation_number = "QT-01102026-001"

        await self.service.finalize_quotation(
            str(self.quotation.id), self.company_id, self.user_id
        )

        self.service.repository.lock_user_for_finalization.assert_not_awaited()
        self.service.repository.count_finalized_by_user_between.assert_not_awaited()

    def test_limit_exception_maps_to_http_429(self) -> None:
        response = map_exception_to_http(
            MonthlyQuotationLimitError("Monthly quotation limit reached.")
        )

        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.detail, "Monthly quotation limit reached.")

    async def test_unfinalized_quotation_cannot_be_marked_final_through_update(self) -> None:
        with self.assertRaisesRegex(BadRequestError, "Use the finalize endpoint"):
            await self.service.update_quotation(
                str(self.quotation.id),
                self.company_id,
                status="Final",
                user_id=self.user_id,
            )

        self.assertEqual(self.quotation.status, "Draft")
        self.service.repository.commit.assert_not_awaited()

    async def test_finalized_quotation_cannot_be_reset_to_draft(self) -> None:
        self.quotation.status = "Final"
        self.quotation.finalized_at = datetime(2026, 10, 1)

        with self.assertRaisesRegex(
            BadRequestError, "Finalized quotation status cannot be changed"
        ):
            await self.service.update_quotation(
                str(self.quotation.id),
                self.company_id,
                status="Draft",
                user_id=self.user_id,
            )

        self.assertEqual(self.quotation.status, "Final")
        self.service.repository.commit.assert_not_awaited()
