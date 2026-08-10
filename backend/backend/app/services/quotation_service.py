from __future__ import annotations

import re
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quotation import Quotation
from app.models.quotation_item import QuotationItem
from app.models.quotation_sequence import QuotationSequence
from app.models.product import Product
from app.models.customer import Customer
from app.models.company import Company
from app.repositories.customer_repository import CustomerRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.quotation_item_repository import QuotationItemRepository
from app.repositories.quotation_repository import QuotationRepository
from app.repositories.quotation_sequence_repository import QuotationSequenceRepository
from app.services.exceptions import BadRequestError, ConflictError, NotFoundError


class QuotationService:
    """Service layer for quotation business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = QuotationRepository(session)
        self.item_repository = QuotationItemRepository(session)
        self.customer_repository = CustomerRepository(session)
        self.company_repository = CompanyRepository(session)
        self.product_repository = ProductRepository(session)
        self.sequence_repository = QuotationSequenceRepository(session)

    async def find_or_create_draft(
        self,
        reference_number: str | None,
        title: str,
        customer_id: str,
        company_id: str,
        issued_at: str,
        items: list[dict[str, str | Decimal | int]],
        created_by_id: str,
        created_by_username: str,
        description: str | None = None,
        valid_until: str | None = None,
        notes: str | None = None,
        terms: str | None = None,
        currency: str | None = None,
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
            )
            return updated

        if not reference_number or not reference_number.strip():
            reference_number = await self.get_next_reference_number(created_by_id, created_by_username)

        existing = await self.repository.get_by_reference(reference_number, company_id)
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
            issued_at=datetime.fromisoformat(issued_at),
            status='Draft',
            valid_until=datetime.fromisoformat(valid_until) if valid_until else None,
            notes=notes,
            terms=terms,
            currency=currency,
        )
        await self.repository.add(quotation)
        await self.repository.flush()

        await self._sync_items_and_totals(quotation, items, company_id, customer_id)
        await self.repository.commit()
        return quotation

    async def create_quotation(
        self,
        reference_number: str | None,
        title: str,
        customer_id: str,
        company_id: str,
        issued_at: str,
        items: list[dict[str, str | Decimal | int]],
        created_by_id: str,
        created_by_username: str,
        description: str | None = None,
        valid_until: str | None = None,
        notes: str | None = None,
        terms: str | None = None,
        currency: str | None = None,
    ) -> Quotation:
        """Create a new quotation or finalize an existing draft."""
        if not reference_number or not reference_number.strip():
            reference_number = await self.get_next_reference_number(created_by_id, created_by_username)

        existing = await self.repository.get_by_reference(reference_number, company_id)
        if existing:
            if existing.status == 'Draft':
                updated = await self.update_quotation(
                    quotation_id=str(existing.id),
                    company_id=company_id,
                    title=title,
                    description=description,
                    issued_at=issued_at,
                    items=items,
                    status='Final',
                    valid_until=valid_until,
                    notes=notes,
                    terms=terms,
                    currency=currency,
                    customer_id=customer_id,
                )
                return await self.finalize_quotation(str(existing.id), company_id)
            raise ConflictError("Quotation with this reference number already exists.")

        quotation = Quotation(
            reference_number=reference_number,
            title=title,
            description=description,
            customer_id=UUID(customer_id),
            company_id=UUID(company_id),
            created_by_id=UUID(created_by_id),
            total_amount=Decimal("0.00"),
            issued_at=datetime.fromisoformat(issued_at),
            status='Final',
            valid_until=datetime.fromisoformat(valid_until) if valid_until else None,
            notes=notes,
            terms=terms,
            currency=currency,
        )
        await self.repository.add(quotation)
        await self.repository.flush()

        await self._sync_items_and_totals(quotation, items, company_id, customer_id)
        await self.repository.commit()
        return await self.finalize_quotation(str(quotation.id), company_id)

    async def finalize_quotation(self, quotation_id: str, company_id: str) -> Quotation:
        quotation = await self.repository.get(quotation_id)
        if not quotation:
            raise NotFoundError("Quotation not found.")

        if str(quotation.company_id) != company_id:
            raise BadRequestError("Quotation does not belong to the current company.")

        if quotation.status == 'Draft':
            quotation.status = 'Final'
        elif quotation.status != 'Final':
            quotation.status = 'Final'

        if not quotation.quotation_number:
            company = await self.company_repository.get(company_id)
            if not company:
                raise NotFoundError("Company does not exist.")

            year = datetime.utcnow().year
            sequence = await self.sequence_repository.get_by_company_and_year(company_id, year)
            if not sequence:
                sequence = QuotationSequence(
                    company_id=UUID(company_id),
                    year=year,
                    prefix=company.quotation_prefix or "QT",
                    next_number=1,
                )
                await self.sequence_repository.add(sequence)
                await self.sequence_repository.flush()

            quotation.quotation_number = f"{sequence.prefix}-{year}-{sequence.next_number:04d}"
            quotation.quotation_year = year
            sequence.next_number += 1

        await self.repository.commit()
        return quotation

    async def _sync_items_and_totals(
        self,
        quotation: Quotation,
        items: list[dict[str, str | Decimal | int]],
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

            quantity = int(item_data["quantity"])
            unit_price = Decimal(item_data.get("unit_price", product.price))
            discount_value = Decimal(item_data.get("discount", 0))
            gst_rate = Decimal(item_data.get("gst", 0))
            line_total = unit_price * Decimal(quantity)
            discount_amount = (line_total * discount_value) / Decimal("100")
            taxable_amount = line_total - discount_amount
            tax_amount = (taxable_amount * gst_rate) / Decimal("100")
            amount = taxable_amount + tax_amount

            subtotal += line_total
            total_discount += discount_amount
            total_tax += tax_amount

            item = QuotationItem(
                quotation_id=quotation.id,
                product_id=UUID(product_id),
                quantity=quantity,
                unit_price=unit_price,
                total_price=amount,
            )
            await self.item_repository.add(item)

        quotation.subtotal = subtotal
        quotation.discount = total_discount
        quotation.tax_amount = total_tax
        quotation.total_amount = subtotal - total_discount + total_tax

        customer = await self.customer_repository.get(customer_id)
        if not customer:
            raise NotFoundError("Customer does not exist.")

        if str(customer.company_id) != company_id:
            raise BadRequestError("Customer does not belong to the current company.")

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

    async def get_next_reference_number(self, created_by_id: str, created_by_username: str) -> str:
        """Generate the next user-specific quotation reference number."""
        username_key = re.sub(r'[^A-Za-z0-9]', '', created_by_username).upper() or 'USER'
        prefix = f"QT-{username_key}"
        quotations = await self.repository.list_by_user(created_by_id)

        highest = 0
        for quotation in quotations:
            if quotation.reference_number and quotation.reference_number.startswith(f"{prefix}-"):
                suffix = quotation.reference_number[len(prefix) + 1 :]
                if suffix.isdigit():
                    highest = max(highest, int(suffix))

        return f"{prefix}-{highest + 1:04d}"

    async def list_quotations(self, company_id: str) -> list[Quotation]:
        """List quotations scoped to a company."""
        return await self.repository.list_by_company(company_id)

    async def get_quotation(self, quotation_id: str) -> Quotation | None:
        """Retrieve a quotation by UUID."""
        return await self.repository.get(quotation_id)

    async def update_quotation(
        self,
        quotation_id: str,
        company_id: str,
        title: str | None = None,
        description: str | None = None,
        issued_at: str | None = None,
        items: list[dict[str, str | Decimal | int]] | None = None,
        status: str | None = None,
        valid_until: str | None = None,
        notes: str | None = None,
        terms: str | None = None,
        currency: str | None = None,
        customer_id: str | None = None,
    ) -> Quotation:
        """Update an existing quotation."""
        quotation = await self.repository.get(quotation_id)
        if not quotation:
            raise NotFoundError("Quotation not found.")

        if str(quotation.company_id) != company_id:
            raise BadRequestError("Quotation does not belong to the current company.")

        if title is not None:
            quotation.title = title
        if description is not None:
            quotation.description = description
        if issued_at is not None:
            quotation.issued_at = datetime.fromisoformat(issued_at)
        if status is not None:
            quotation.status = status
        if valid_until is not None:
            quotation.valid_until = datetime.fromisoformat(valid_until)
        if notes is not None:
            quotation.notes = notes
        if terms is not None:
            quotation.terms = terms
        if currency is not None:
            quotation.currency = currency

        if customer_id is not None:
            customer = await self.customer_repository.get(customer_id)
            if not customer:
                raise NotFoundError("Customer does not exist.")
            if str(customer.company_id) != company_id:
                raise BadRequestError("Customer does not belong to the current company.")
            quotation.customer_id = UUID(customer_id)

        if items is not None:
            await self._sync_items_and_totals(
                quotation,
                items,
                company_id,
                customer_id or str(quotation.customer_id),
            )

        await self.repository.commit()
        return quotation

    async def delete_quotation(self, quotation_id: str) -> None:
        """Delete an existing quotation."""
        quotation = await self.repository.get(quotation_id)
        if not quotation:
            raise NotFoundError("Quotation not found.")

        await self.repository.delete(quotation)
        await self.repository.commit()

    async def get_quotation_with_details(self, quotation_id: str) -> tuple[Quotation, list[QuotationItem], Customer, Company, dict[str, Product]]:
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
