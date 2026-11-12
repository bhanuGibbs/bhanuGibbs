from __future__ import annotations

from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.models
from app.api.sales_inventory_router import (
    adjust_inventory,
    approve_order,
    create_dealer,
    create_order,
    create_product,
    delete_product,
    dealer_sales_report,
    download_invoice_pdf,
    inventory_movement_report,
    list_inventory_transactions,
    list_inventory,
    list_orders,
    list_products,
    low_stock_report,
    list_notifications,
    monthly_sales_report,
    pending_orders_report,
    rep_performance_report,
    reject_order,
    sales_report,
    export_report_csv,
    submit_order,
    update_order,
    update_order_status,
)
from app.core.database import Base
from app.models.company import Company
from app.models.role import Role
from app.models.user import User
from app.schemas.sales_inventory import (
    DealerCreate,
    InventoryAdjustment,
    OrderCreate,
    OrderReject,
    OrderItemCreate,
    OrderStatusUpdate,
    OrderUpdate,
    ProductCreate,
)
from app.services.email_service import EmailDeliveryError, EmailService


class SalesInventoryWorkflowTests(IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)

    async def asyncTearDown(self) -> None:
        await self.engine.dispose()

    async def test_stock_changes_only_on_approval_and_tenant_data_isolated(self) -> None:
        async with self.session_factory() as session:
            admin_role = Role(name="Admin")
            sales_role = Role(name="Sales")
            company_a = Company(name="Shared organization name", business_profile="sales_inventory")
            company_b = Company(name="Shared organization name", business_profile="sales_inventory")
            session.add_all([admin_role, sales_role, company_a, company_b])
            await session.flush()
            admin = User(
                username="tenant-a-admin",
                email="tenant-a-admin@example.com",
                hashed_password="not-used",
                role_id=admin_role.id,
                company_id=company_a.id,
                business_profile="sales_inventory",
            )
            sales = User(
                username="tenant-a-sales",
                email="tenant-a-sales@example.com",
                hashed_password="not-used",
                role_id=sales_role.id,
                company_id=company_a.id,
                business_profile="sales_inventory",
            )
            other_admin = User(
                username="tenant-b-admin",
                email="tenant-b-admin@example.com",
                hashed_password="not-used",
                role_id=admin_role.id,
                company_id=company_b.id,
                business_profile="sales_inventory",
            )
            session.add_all([admin, sales, other_admin])
            await session.commit()

            admin_context = {
                "id": str(admin.id),
                "company_id": str(company_a.id),
                "role": "Admin",
                "business_profile": "sales_inventory",
            }
            sales_context = {
                "id": str(sales.id),
                "company_id": str(company_a.id),
                "role": "Sales",
                "business_profile": "sales_inventory",
            }
            other_context = {
                "id": str(other_admin.id),
                "company_id": str(company_b.id),
                "role": "Admin",
                "business_profile": "sales_inventory",
            }

            dealer = await create_dealer(
                DealerCreate(name="Dealer One", dealer_code="D-1"),
                current_user=admin_context,
                session=session,
            )
            product = await create_product(
                ProductCreate(
                    product_code="P-1",
                    name="Product One",
                    unit="case",
                    unit_price="12.50",
                    reorder_level="2",
                ),
                current_user=admin_context,
                session=session,
            )
            self.assertEqual(await list_inventory_transactions(admin_context, session), [])
            with patch.object(
                EmailService,
                "send_sales_order_alert_email",
                new_callable=AsyncMock,
            ) as send_order_alert:
                send_order_alert.side_effect = EmailDeliveryError("SMTP unavailable")
                order = await create_order(
                    OrderCreate(
                        dealer_id=dealer["id"],
                        items=[OrderItemCreate(product_id=product["id"], quantity="4")],
                        submit=True,
                    ),
                    current_user=sales_context,
                    session=session,
                )
            send_order_alert.assert_awaited_once()
            self.assertEqual(send_order_alert.await_args.kwargs["recipient"], admin.email)
            self.assertEqual(send_order_alert.await_args.kwargs["order_number"], order["order_number"])
            self.assertEqual(send_order_alert.await_args.kwargs["items"][0]["product_name"], "Product One")

            product_before_approval = (await list_products(sales_context, session))[0]
            self.assertEqual(product_before_approval["quantity"], "0.000")
            self.assertEqual(order["status"], "Pending Approval")

            with self.assertRaises(HTTPException) as sales_approval:
                await approve_order(UUID(order["id"]), sales_context, session)
            self.assertEqual(sales_approval.exception.status_code, 403)

            with self.assertRaises(HTTPException) as no_stock:
                await approve_order(UUID(order["id"]), admin_context, session)
            self.assertEqual(no_stock.exception.status_code, 409)

            await adjust_inventory(
                InventoryAdjustment(
                    product_id=product["id"],
                    quantity_delta="10",
                    transaction_type="Purchase",
                    reason="Opening stock",
                ),
                current_user=admin_context,
                session=session,
            )
            approved = await approve_order(
                UUID(order["id"]),
                current_user=admin_context,
                session=session,
            )
            self.assertEqual(approved["status"], "Approved")
            self.assertIsNotNone(approved["invoice"])
            self.assertEqual(approved["invoice"]["invoice_number"].startswith("SI-INV-"), True)

            invoice_pdf = await download_invoice_pdf(
                UUID(approved["invoice"]["id"]),
                current_user=sales_context,
                session=session,
            )
            self.assertEqual(invoice_pdf.media_type, "application/pdf")
            self.assertTrue(invoice_pdf.body.startswith(b"%PDF"))
            product_csv = await export_report_csv(
                "product-sales",
                current_user=sales_context,
                session=session,
            )
            self.assertIn(b"product_id,product_code,product_name", product_csv.body)
            self.assertIn(b"Product One", product_csv.body)
            with self.assertRaises(HTTPException) as cross_tenant_invoice:
                await download_invoice_pdf(
                    UUID(approved["invoice"]["id"]),
                    current_user=other_context,
                    session=session,
                )
            self.assertEqual(cross_tenant_invoice.exception.status_code, 404)

            sales_summary = await sales_report(sales_context, session)
            self.assertEqual(sales_summary["approved_order_count"], 1)
            self.assertEqual(sales_summary["product_sales"][0]["unit"], "case")
            self.assertEqual(len(await dealer_sales_report(sales_context, session)), 1)
            self.assertEqual(len(await rep_performance_report(sales_context, session)), 1)
            self.assertEqual(len(await monthly_sales_report(sales_context, session)), 1)
            self.assertEqual((await sales_report(other_context, session))["approved_order_count"], 0)
            self.assertEqual(await dealer_sales_report(other_context, session), [])
            await update_order_status(
                UUID(order["id"]),
                OrderStatusUpdate(status="Processing"),
                current_user=admin_context,
                session=session,
            )
            dispatched = await update_order_status(
                UUID(order["id"]),
                OrderStatusUpdate(status="Dispatched"),
                current_user=admin_context,
                session=session,
            )
            self.assertEqual(dispatched["status"], "Dispatched")
            self.assertIn("dispatch", {item["event_type"] for item in await list_notifications(sales_context, session)})

            product_after_approval = (await list_products(sales_context, session))[0]
            self.assertEqual(product_after_approval["quantity"], "6.000")
            with self.assertRaises(HTTPException) as duplicate_approval:
                await approve_order(
                    UUID(order["id"]),
                    current_user=admin_context,
                    session=session,
                )
            self.assertEqual(duplicate_approval.exception.status_code, 409)

            rejected_order = await create_order(
                OrderCreate(
                    dealer_id=dealer["id"],
                    items=[OrderItemCreate(product_id=product["id"], quantity="1")],
                    submit=True,
                ),
                current_user=sales_context,
                session=session,
            )
            self.assertEqual(len(await pending_orders_report(admin_context, session)), 1)
            await reject_order(
                UUID(rejected_order["id"]),
                OrderReject(reason="Please confirm delivery date."),
                current_user=admin_context,
                session=session,
            )
            after_rejection = (await list_products(sales_context, session))[0]
            self.assertEqual(after_rejection["quantity"], "6.000")
            movement = await inventory_movement_report(admin_context, session)
            self.assertEqual(len(movement), 2)
            self.assertEqual(await low_stock_report(admin_context, session), [])

            revised = await update_order(
                UUID(rejected_order["id"]),
                OrderUpdate(
                    items=[OrderItemCreate(product_id=product["id"], quantity="2")],
                    notes="Delivery date confirmed.",
                ),
                current_user=sales_context,
                session=session,
            )
            self.assertEqual(revised["status"], "Draft")
            self.assertIsNone(revised["rejection_reason"])
            self.assertEqual(revised["total_amount"], "25.00")
            self.assertEqual(
                [(entry["from_status"], entry["to_status"]) for entry in revised["history"]][-2:],
                [("Pending Approval", "Rejected"), ("Rejected", "Draft")],
            )
            submitted = await submit_order(UUID(rejected_order["id"]), sales_context, session)
            self.assertEqual(submitted["status"], "Pending Approval")
            cancelled = await update_order_status(
                UUID(rejected_order["id"]),
                OrderStatusUpdate(status="Cancelled"),
                current_user=sales_context,
                session=session,
            )
            self.assertEqual(cancelled["status"], "Cancelled")
            self.assertEqual(cancelled["history"][-1]["to_status"], "Cancelled")

            self.assertEqual(await list_products(other_context, session), [])
            self.assertEqual(await list_orders(other_context, session), [])

            opening_stock_product = await create_product(
                ProductCreate(
                    product_code="P-OPEN",
                    name="Opening Stock Product",
                    unit="bag",
                    unit_price="8.00",
                    opening_stock="24.500",
                ),
                current_user=admin_context,
                session=session,
            )
            self.assertEqual(opening_stock_product["quantity"], "24.500")
            opening_transactions = [
                transaction
                for transaction in await list_inventory_transactions(admin_context, session)
                if transaction["product_name"] == "Opening Stock Product"
            ]
            self.assertEqual(len(opening_transactions), 1)
            self.assertEqual(opening_transactions[0]["transaction_type"], "Purchase")
            self.assertEqual(opening_transactions[0]["quantity_delta"], "24.500")
            self.assertEqual(opening_transactions[0]["balance_after"], "24.500")
            self.assertEqual(opening_transactions[0]["unit"], "bag")
            with self.assertRaises(HTTPException) as sales_delete:
                await delete_product(UUID(opening_stock_product["id"]), sales_context, session)
            self.assertEqual(sales_delete.exception.status_code, 403)
            await delete_product(UUID(opening_stock_product["id"]), admin_context, session)
            inactive_product = next(
                product
                for product in await list_products(admin_context, session)
                if product["id"] == opening_stock_product["id"]
            )
            self.assertFalse(inactive_product["is_active"])
            self.assertEqual(inactive_product["quantity"], "24.500")
            self.assertNotIn(
                opening_stock_product["id"],
                {item["product_id"] for item in await list_inventory(admin_context, session)},
            )
