from __future__ import annotations

import re
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quotation import Quotation
from app.models.quotation_item import QuotationItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.company import Company
from app.models.audit_event import AuditEvent
from app.repositories.quotation_daily_sequence_repository import QuotationDailySequenceRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.quotation_item_repository import QuotationItemRepository
from app.repositories.quotation_repository import QuotationRepository
from app.services.exceptions import (
    BadRequestError,
    ConflictError,
    MonthlyQuotationLimitError,
    NotFoundError,
    ServiceError,
)

MONTHLY_FINALIZATION_LIMITS: dict[str, int | None] = {
    "free": 10,
    "basic": 50,
    "premium": None,
}


def _money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _database_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed
    return parsed.astimezone(timezone.utc).replace(tzinfo=None)


class QuotationService:
    """Service layer for quotation business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = QuotationRepository(session)
        self.item_repository = QuotationItemRepository(session)
        self.customer_repository = CustomerRepository(session)
        self.company_repository = CompanyRepository(session)
        self.product_repository = ProductRepository(session)
        self.daily_sequence_repository = QuotationDailySequenceRepository(session)

    async def find_or_create_draft(
            self,
            reference_number: str | None,
            title: str,
            customer_id: str,
            company_id: str,
            issued_at: str,
            items: list[dict[str, str | Decimal | int | None]],
            created_by_id: str,
            created_by_username: str,
            description: str | None = None,
            valid_until: str | None = None,
            notes: str | None = None,
            terms: str | None = None,
            currency: str | None = None,
            shipping_amount: Decimal = Decimal("0.00"),
            commit: bool = True,
    ) -> Quotation:
        """Create or update a draft quotation for preview."""
        draft = await self.repository.get_latest_draft_by_user(created_by_id, company_id)
        if draft:
            if reference_number and reference_number.strip() and reference_number != draft.reference_number:
                raise ConflictError("Cannot change reference number on an existing draft.")

            updated = await self.update_quotation(
                quotation_id=str(draft.id),
                company_id=company_id,
                title=title,
                description=description,
                issued_at=issued_at,
                items=items,
                status='Draft',
                valid_until=valid_until,
                notes=notes,
                terms=terms,
                currency=currency,
                customer_id=customer_id,
                shipping_amount=shipping_amount,
                user_id=created_by_id,
                commit=False,
            )
            return updated

        if not reference_number or not reference_number.strip():
            prefix = "INV" if title.strip().lower() in ("billing", "invoice") else "QT"
            reference_number = await self.get_next_reference_number(created_by_id, created_by_username, prefix)

        existing = await self.repository.get_by_reference(reference_number, company_id)
        if existing and str(existing.created_by_id) != created_by_id:
            raise ConflictError("Quotation reference number is already in use.")
        if existing and existing.status != 'Draft':
            raise ConflictError("Quotation with this reference number already exists.")

        quotation = Quotation(
            reference_number=reference_number,
            title=title,
            description=description,
            customer_id=UUID(customer_id),
            company_id=UUID(company_id),
            created_by_id=UUID(created_by_id),
            total_amount=Decimal("0.00"),
            issued_at=_database_datetime(issued_at),
            status='Draft',
            valid_until=_database_datetime(valid_until) if valid_until else None,
            notes=notes,
            terms=terms,
            currency=currency,
            shipping_amount=shipping_amount,
        )
        await self.repository.add(quotation)
        await self.repository.flush()

        await self._sync_items_and_totals(quotation, items, company_id, customer_id)
        await self._record_audit(quotation, created_by_id, "created", None)
        if commit:
            await self.repository.commit()
        return await self._refresh_quotation(quotation)

    async def create_quotation(
            self,
            reference_number: str | None,
            title: str,
            customer_id: str,
            company_id: str,
            issued_at: str,
            items: list[dict[str, str | Decimal | int | None]],
            created_by_id: str,
            created_by_username: str,
            description: str | None = None,
            valid_until: str | None = None,
            notes: str | None = None,
            terms: str | None = None,
            currency: str | None = None,
            shipping_amount: Decimal = Decimal("0.00"),
            commit: bool = True,
    ) -> Quotation:
        """Create a new quotation or finalize an existing draft."""
        if not reference_number or not reference_number.strip():
            prefix = "INV" if title.strip().lower() in ("billing", "invoice") else "QT"
            reference_number = await self.get_next_reference_number(created_by_id, created_by_username, prefix)

        existing = await self.repository.get_by_reference(reference_number, company_id)
        if existing:
            if str(existing.created_by_id) != created_by_id:
                raise ConflictError("Quotation reference number is already in use.")
            if existing.status == 'Draft':
                await self.update_quotation(
                    quotation_id=str(existing.id),
                    company_id=company_id,
                    title=title,
                    description=description,
                    issued_at=issued_at,
                    items=items,
                    status='Draft',
                    valid_until=valid_until,
                    notes=notes,
                    terms=terms,
                    currency=currency,
                    customer_id=customer_id,
                    shipping_amount=shipping_amount,
                    user_id=created_by_id,
                    commit=False,
                )
                return await self.finalize_quotation(
                    str(existing.id), company_id, created_by_id, commit=commit
                )
            raise ConflictError("Quotation with this reference number already exists.")

        quotation = Quotation(
            reference_number=reference_number,
            title=title,
            description=description,
            customer_id=UUID(customer_id),
            company_id=UUID(company_id),
            created_by_id=UUID(created_by_id),
            total_amount=Decimal("0.00"),
            issued_at=_database_datetime(issued_at),
            status='Draft',
            valid_until=_database_datetime(valid_until) if valid_until else None,
            notes=notes,
            terms=terms,
            currency=currency,
            shipping_amount=shipping_amount,
        )
        await self.repository.add(quotation)
        await self.repository.flush()

        await self._sync_items_and_totals(quotation, items, company_id, customer_id)
        await self._record_audit(quotation, created_by_id, "created", None)
        return await self.finalize_quotation(
            str(quotation.id), company_id, created_by_id, commit=commit
        )

    async def finalize_quotation(
        self,
        quotation_id: str,
        company_id: str,
        user_id: str,
        commit: bool = True,
    ) -> Quotation:
        quotation = await self.repository.get(quotation_id)
        if not quotation:
            raise NotFoundError("Quotation not found.")

        if str(quotation.company_id) != company_id:
            raise BadRequestError("Quotation does not belong to the current company.")
        if str(quotation.created_by_id) != user_id:
            raise NotFoundError("Quotation not found.")

        if quotation.finalized_at is not None:
            return quotation

        before_data = await self._quotation_snapshot(quotation)

        if quotation.finalized_at is None:
            now = datetime.now(timezone.utc)
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if period_start.month == 12:
                period_end = period_start.replace(year=period_start.year + 1, month=1)
            else:
                period_end = period_start.replace(month=period_start.month + 1)

            plan = await self.repository.lock_user_for_finalization(user_id)
            if plan not in MONTHLY_FINALIZATION_LIMITS:
                raise RuntimeError(f"Unknown subscription plan: {plan}")
            monthly_limit = MONTHLY_FINALIZATION_LIMITS[plan]
            if monthly_limit is not None:
                finalized_count = await self.repository.count_finalized_by_user_between(
                    user_id,
                    period_start.replace(tzinfo=None),
                    period_end.replace(tzinfo=None),
                )
                if finalized_count >= monthly_limit:
                    reset_at = period_end.strftime("%Y-%m-%d 00:00 UTC")
                    raise MonthlyQuotationLimitError(
                        f"Monthly limit of {monthly_limit} finalized quotations/invoices "
                        f"for the {plan.title()} plan reached. The limit resets at {reset_at}."
                    )

            quotation.finalized_at = now.replace(tzinfo=None)
            await self.repository.record_finalization(
                user_id, str(quotation.id), quotation.finalized_at
            )

        quotation.status = 'Final'
        quotation.updated_by_id = UUID(user_id)

        if not quotation.quotation_number:
            company = await self.company_repository.get(company_id)
            if not company:
                raise NotFoundError("Company does not exist.")

            sequence_date = quotation.issued_at.date()
            sequence_number = await self.daily_sequence_repository.next_number(company_id, sequence_date)
            prefix =  "INV" if quotation.title.strip().lower() in ("billing", "invoice") else company.quotation_prefix or "QT"
            quotation.quotation_number = f"{prefix}-{sequence_date:%d%m%Y}-{sequence_number:03d}"
            quotation.quotation_year = sequence_date.year
        await self._record_audit(quotation, user_id, "finalized", before_data)
        if commit:
            await self.repository.commit()
        return await self._refresh_quotation(quotation)

    async def _quotation_snapshot(self, quotation: Quotation) -> dict[str, object]:
        fields = (
            "reference_number", "quotation_number", "title", "description", "customer_id",
            "issued_at", "valid_until", "status", "subtotal", "discount", "tax_amount",
            "shipping_amount", "total_amount", "currency", "terms", "notes",
            "customer_name", "customer_email", "customer_phone_number", "customer_address",
        )
        snapshot: dict[str, object] = {}
        for name in fields:
            value = getattr(quotation, name, None)
            if isinstance(value, (datetime,)):
                value = value.isoformat()
            elif isinstance(value, Decimal):
                value = str(value)
            elif isinstance(value, UUID):
                value = str(value)
            snapshot[name] = value

        items = await self.item_repository.list_by_quotation(str(quotation.id))
        snapshot["items"] = [
            {
                "product_id": str(item.product_id),
                "name": item.item_name,
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "discount": str(item.discount),
                "tax_percentage": str(item.tax_percentage),
                "tax_amount": str(item.tax_amount),
                "amount": str(item.amount),
            }
            for item in items
        ]
        return snapshot

    async def _record_audit(
        self,
        quotation: Quotation,
        actor_user_id: str,
        action: str,
        before_data: dict[str, object] | None,
    ) -> None:
        after_data = await self._quotation_snapshot(quotation)
        self.repository.session.add(
            AuditEvent(
                actor_user_id=UUID(actor_user_id),
                resource_type="quotation",
                resource_id=UUID(str(quotation.id)),
                action=action,
                before_data=before_data,
                after_data=after_data,
            )
        )

    async def _sync_items_and_totals(
            self,
            quotation: Quotation,
            items: list[dict[str, str | Decimal | int | None]],
            company_id: str,
            customer_id: str,
    ) -> None:
        existing_items = await self.item_repository.list_by_quotation(str(quotation.id))
        for item in existing_items:
            await self.item_repository.delete(item)

        if not items:
            raise BadRequestError("Quotation must contain at least one item.")

        subtotal = Decimal("0.00")
        total_discount = Decimal("0.00")
        total_tax = Decimal("0.00")

        for item_data in items:
            product_id = str(item_data["product_id"])
            product = await self.product_repository.get(product_id)
            if not product:
                raise NotFoundError("Product does not exist.")
            if str(product.company_id) != company_id:
                raise BadRequestError("Product does not belong to the current company.")
            if str(product.created_by_id) != str(quotation.created_by_id):
                raise NotFoundError("Product not found.")

            quantity = int(item_data["quantity"])
            unit_price = _money(Decimal(item_data["unit_price"]))
            discount_value = Decimal(item_data.get("discount") or 0)
            gst_rate = Decimal(item_data.get("gst") or 0)
            line_total = _money(unit_price * Decimal(quantity))
            discount_amount = _money((line_total * discount_value) / Decimal("100"))
            taxable_amount = line_total - discount_amount
            tax_amount = _money((taxable_amount * gst_rate) / Decimal("100"))
            amount = _money(taxable_amount + tax_amount)

            subtotal += line_total
            total_discount += discount_amount
            total_tax += tax_amount

            item = QuotationItem(
                quotation_id=quotation.id,
                product_id=UUID(product_id),
                quantity=quantity,
                unit_price=unit_price,
                total_price=amount,
                item_name=str(item_data.get("item_name") or product.name),
                description=item_data.get("description"),
                unit=item_data.get("unit"),
                discount=discount_value,
                tax_percentage=gst_rate,
                tax_amount=tax_amount,
                amount=amount,
            )
            await self.item_repository.add(item)

        quotation.subtotal = _money(subtotal)
        quotation.discount = _money(total_discount)
        quotation.tax_amount = _money(total_tax)
        quotation.shipping_amount = _money(quotation.shipping_amount or Decimal("0.00"))
        quotation.total_amount = _money(
            quotation.subtotal - quotation.discount + quotation.tax_amount + quotation.shipping_amount
        )

        customer = await self.customer_repository.get(customer_id)
        if not customer:
            raise NotFoundError("Customer does not exist.")

        if str(customer.company_id) != company_id:
            raise BadRequestError("Customer does not belong to the current company.")
        if str(customer.created_by_id) != str(quotation.created_by_id):
            raise NotFoundError("Customer not found.")

        company = await self.company_repository.get(company_id)
        if not company:
            raise NotFoundError("Company does not exist.")

        quotation.customer_name = customer.name
        quotation.customer_email = customer.email
        quotation.customer_phone_number = customer.phone_number
        quotation.customer_address = customer.address
        quotation.company_name = company.name
        quotation.company_address = company.address
        quotation.company_phone_number = company.phone_number
        quotation.company_email = company.email
        quotation.company_website = company.website
        quotation.company_gstin = company.gstin

    async def get_next_reference_number(
            self,
            created_by_id: str,
            created_by_username: str,
            prefix: str = "QT",
    ) -> str:
        """Generate the next user-specific quotation reference number."""
        username_key = re.sub(r'[^A-Za-z0-9]', '', created_by_username).upper() or 'USER'
        reference_prefix = f"{prefix}-{username_key}"
        quotations = await self.repository.list_by_user(created_by_id)

        highest = 0
        for quotation in quotations:
            if quotation.reference_number and quotation.reference_number.startswith(f"{reference_prefix}-"):
                suffix = quotation.reference_number[len(reference_prefix) + 1:]
                if suffix.isdigit():
                    highest = max(highest, int(suffix))

        return f"{reference_prefix}-{highest + 1:04d}"

    async def list_quotations(self, company_id: str, user_id: str) -> list[Quotation]:
        """List quotations owned by a user within a company."""
        return await self.repository.list_by_company(company_id, user_id)

    async def get_quotation(self, quotation_id: str) -> Quotation | None:
        """Retrieve a quotation by UUID."""
        return await self.repository.get(quotation_id)

    async def _refresh_quotation(self, quotation: Quotation) -> Quotation:
        await self.repository.session.refresh(quotation)
        await self.repository.session.refresh(quotation, attribute_names=["items"])
        return quotation

    async def update_quotation(
            self,
            quotation_id: str,
            company_id: str,
            title: str | None = None,
            description: str | None = None,
            issued_at: str | None = None,
            items: list[dict[str, str | Decimal | int | None]] | None = None,
            status: str | None = None,
            valid_until: str | None = None,
            notes: str | None = None,
            terms: str | None = None,
            currency: str | None = None,
            customer_id: str | None = None,
            shipping_amount: Decimal | None = None,
            user_id: str | None = None,
            commit: bool = True,
    ) -> Quotation:
        """Update an existing quotation."""
        quotation = await self.repository.get(quotation_id)
        if not quotation:
            raise NotFoundError("Quotation not found.")

        if str(quotation.company_id) != company_id:
            raise BadRequestError("Quotation does not belong to the current company.")
        if user_id and str(quotation.created_by_id) != user_id:
            raise NotFoundError("Quotation not found.")
        if quotation.finalized_at is not None:
            raise ConflictError("Finalized documents cannot be edited.")

        before_data = await self._quotation_snapshot(quotation)

        if title is not None:
            quotation.title = title
        if description is not None:
            quotation.description = description
        if issued_at is not None:
            quotation.issued_at = _database_datetime(issued_at)
        if status is not None:
            if status.strip().lower() != "draft":
                raise BadRequestError("Use the finalize endpoint to finalize a quotation.")
            quotation.status = status
        if valid_until is not None:
            quotation.valid_until = _database_datetime(valid_until)
        if notes is not None:
            quotation.notes = notes
        if terms is not None:
            quotation.terms = terms
        if currency is not None:
            quotation.currency = currency
        if shipping_amount is not None:
            quotation.shipping_amount = _money(shipping_amount)

        if customer_id is not None:
            customer = await self.customer_repository.get(customer_id)
            if not customer:
                raise NotFoundError("Customer does not exist.")
            if str(customer.company_id) != company_id:
                raise BadRequestError("Customer does not belong to the current company.")
            if user_id and str(customer.created_by_id) != user_id:
                raise NotFoundError("Customer not found.")
            quotation.customer_id = UUID(customer_id)

        if items is not None:
            await self._sync_items_and_totals(
                quotation,
                items,
                company_id,
                customer_id or str(quotation.customer_id),
            )
        else:
            quotation.total_amount = _money(
                quotation.subtotal - quotation.discount + quotation.tax_amount + quotation.shipping_amount
            )

        if user_id:
            quotation.updated_by_id = UUID(user_id)
            await self._record_audit(quotation, user_id, "updated", before_data)
        if commit:
            await self.repository.commit()
        return await self._refresh_quotation(quotation)

    async def update_invoice_payment_status(
            self,
            quotation_id: str,
            company_id: str,
            user_id: str,
            status: str,
    ) -> Quotation:
        """Update the payment status of an owned, finalized invoice."""
        quotation = await self.repository.get(quotation_id)
        if not quotation or str(quotation.company_id) != company_id:
            raise NotFoundError("Invoice not found.")
        if str(quotation.created_by_id) != user_id:
            raise NotFoundError("Invoice not found.")
        if quotation.title.strip().lower() not in {"invoice", "billing"}:
            raise BadRequestError("Payment status can only be changed for invoices.")
        if quotation.status.strip().lower() not in {"final", "paid", "unpaid"}:
            raise BadRequestError("Only finalized invoices can be marked paid or unpaid.")

        before_data = await self._quotation_snapshot(quotation)
        quotation.status = status
        quotation.updated_by_id = UUID(user_id)
        await self._record_audit(quotation, user_id, "payment_status_changed", before_data)
        await self.repository.commit()
        return await self._refresh_quotation(quotation)

    async def delete_quotation(self, quotation_id: str, user_id: str, allow_admin_override: bool = False) -> None:
        """Delete an existing quotation."""
        quotation = await self.repository.get(quotation_id)
        if not quotation:
            raise NotFoundError("Quotation not found.")
        if str(quotation.created_by_id) != user_id and not allow_admin_override:
            raise NotFoundError("Quotation not found.")
        if quotation.finalized_at is not None and not allow_admin_override:
            raise ConflictError("Finalized documents cannot be deleted.")

        before_data = await self._quotation_snapshot(quotation)
        await self._record_audit(quotation, user_id, "deleted", before_data)
        await self.repository.delete(quotation)
        try:
            await self.repository.commit()
        except IntegrityError:
            await self.repository.rollback()
            raise ServiceError("Cannot delete this quotation because it has related records.")

    async def get_quotation_with_details(self, quotation_id: str) -> tuple[
        Quotation, list[QuotationItem], Customer, Company, dict[str, Product]]:
        """Return quotation with related customer, company, items, and products."""
        quotation = await self.repository.get(quotation_id)
        if not quotation:
            raise NotFoundError("Quotation not found.")

        customer = await self.customer_repository.get(str(quotation.customer_id))
        if not customer:
            raise NotFoundError("Customer not found.")

        company = await self.company_repository.get(str(quotation.company_id))
        if not company:
            raise NotFoundError("Company not found.")

        items = await self.item_repository.list_by_quotation(str(quotation.id))
        products: dict[str, Product] = {}
        for item in items:
            product = await self.product_repository.get(str(item.product_id))
            if product:
                products[str(item.product_id)] = product
        return quotation, items, customer, company, products
