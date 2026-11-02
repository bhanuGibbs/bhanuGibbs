from __future__ import annotations

import uuid
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pos_category import POSCategory
from app.models.pos_stock_movement import POSStockMovement
from app.models.pos_transaction import POSTransaction
from app.models.pos_transaction_item import POSTransactionItem
from app.models.pos_payment import POSPayment
from app.models.pos_return import POSReturn
from app.models.pos_return_item import POSReturnItem
from app.models.pos_product import POSProduct
from app.models.pos_product_variant import POSProductVariant
from app.repositories.pos_transaction_repository import POSTransactionRepository
from app.repositories.pos_product_repository import POSProductRepository
from app.repositories.pos_inventory_repository import POSInventoryRepository
from app.services.exceptions import NotFoundError, BadRequestError


class POSTransactionService:
    """Service layer for POS transaction business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.transaction_repo = POSTransactionRepository(session)
        self.product_repo = POSProductRepository(session)
        self.inventory_repo = POSInventoryRepository(session)

    def _generate_transaction_number(self, company_id: str) -> str:
        """Generate a unique transaction number like POS-01112026-001."""
        today = date.today().strftime("%d%m%Y")
        return f"POS-{today}-{uuid.uuid4().hex[:6].upper()}"

    async def checkout(
        self,
        company_id: str,
        created_by_id: str,
        items: list[dict],
        payment_method: str,
        payment_amount: Decimal,
        discount: Decimal = Decimal("0"),
        notes: str | None = None,
    ) -> POSTransaction:
        """Process a checkout transaction."""
        if not items:
            raise BadRequestError("Cart is empty.")

        subtotal = Decimal("0")
        tax_amount = Decimal("0")

        # Calculate totals and check stock
        for item in items:
            product_id = item.get("product_id")
            variant_id = item.get("variant_id")
            quantity = item.get("quantity", 1)
            unit_price = Decimal(str(item.get("unit_price", 0)))
            item_discount = Decimal(str(item.get("discount", 0)))
            item_tax = Decimal(str(item.get("tax", 18)))

            # Check stock
            if variant_id:
                variant = await self.product_repo.session.get(POSProductVariant, variant_id)
                if not variant or variant.stock_quantity < quantity:
                    raise BadRequestError(f"Insufficient stock for variant: {item.get('product_name', 'Unknown')}")
            else:
                product = await self.product_repo.get(product_id)
                if not product or product.stock_quantity < quantity:
                    raise BadRequestError(f"Insufficient stock for: {item.get('product_name', 'Unknown')}")

            line_total = (unit_price * quantity) - item_discount
            tax = line_total * item_tax / Decimal("100")
            subtotal += line_total
            tax_amount += tax

        grand_total = subtotal - discount + tax_amount

        # Create transaction
        transaction = POSTransaction(
            company_id=company_id,
            transaction_number=self._generate_transaction_number(company_id),
            created_by_id=created_by_id,
            subtotal=subtotal,
            discount=discount,
            tax_amount=tax_amount,
            grand_total=grand_total,
            payment_method=payment_method,
            payment_amount=payment_amount,
            status="completed",
            notes=notes,
        )
        transaction = await self.transaction_repo.add(transaction)

        # Create items and deduct stock
        for item in items:
            product_id = item.get("product_id")
            variant_id = item.get("variant_id")
            quantity = item.get("quantity", 1)
            unit_price = Decimal(str(item.get("unit_price", 0)))
            item_discount = Decimal(str(item.get("discount", 0)))
            item_tax = Decimal(str(item.get("tax", 18)))

            line_total = (unit_price * quantity) - item_discount
            tax = line_total * item_tax / Decimal("100")

            trans_item = POSTransactionItem(
                transaction_id=transaction.id,
                company_id=company_id,
                product_id=product_id,
                variant_id=variant_id,
                product_name=item.get("product_name", ""),
                sku=item.get("sku", ""),
                barcode=item.get("barcode", ""),
                quantity=quantity,
                unit_price=unit_price,
                discount=item_discount,
                tax_amount=tax,
                line_total=line_total + tax,
            )
            await self.transaction_repo.add_item(trans_item)

            # Deduct stock
            if variant_id:
                variant = await self.product_repo.session.get(POSProductVariant, variant_id)
                if variant:
                    variant.stock_quantity -= quantity
                    movement = POSStockMovement(
                        company_id=company_id,
                        product_id=product_id,
                        variant_id=variant_id,
                        movement_type="out",
                        quantity=-quantity,
                        reference_type="transaction",
                        reference_id=str(transaction.id),
                        created_by_id=created_by_id,
                    )
                    await self.inventory_repo.add_movement(movement)
            else:
                product = await self.product_repo.get(product_id)
                if product:
                    product.stock_quantity -= quantity
                    movement = POSStockMovement(
                        company_id=company_id,
                        product_id=product_id,
                        movement_type="out",
                        quantity=-quantity,
                        reference_type="transaction",
                        reference_id=str(transaction.id),
                        created_by_id=created_by_id,
                    )
                    await self.inventory_repo.add_movement(movement)

        # Create payment record
        payment = POSPayment(
            transaction_id=transaction.id,
            company_id=company_id,
            payment_method=payment_method,
            amount=payment_amount,
        )
        await self.transaction_repo.add_payment(payment)

        await self.transaction_repo.commit()
        return transaction

    async def get_transaction(self, transaction_id: str, company_id: str) -> POSTransaction:
        """Get a transaction by ID."""
        transaction = await self.transaction_repo.get(transaction_id)
        if not transaction or str(transaction.company_id) != company_id:
            raise NotFoundError("Transaction not found.")
        return transaction

    async def list_transactions(
        self, company_id: str, start_date: date | None = None, end_date: date | None = None, status: str | None = None
    ) -> list[POSTransaction]:
        """List transactions for a company."""
        return await self.transaction_repo.list_by_company(company_id, start_date, end_date, status)

    async def cancel_transaction(self, transaction_id: str, company_id: str, created_by_id: str) -> POSTransaction:
        """Cancel a transaction and restore stock."""
        transaction = await self.get_transaction(transaction_id, company_id)
        if transaction.status == "cancelled":
            raise BadRequestError("Transaction is already cancelled.")

        transaction.status = "cancelled"

        # Restore stock
        items = await self.transaction_repo.get_items(transaction_id)
        for item in items:
            if item.variant_id:
                variant = await self.product_repo.session.get(POSProductVariant, item.variant_id)
                if variant:
                    variant.stock_quantity += item.quantity
                    movement = POSStockMovement(
                        company_id=company_id,
                        product_id=item.product_id,
                        variant_id=item.variant_id,
                        movement_type="return",
                        quantity=item.quantity,
                        reference_type="transaction",
                        reference_id=str(transaction_id),
                        notes="Stock restored on cancellation",
                        created_by_id=created_by_id,
                    )
                    await self.inventory_repo.add_movement(movement)
            else:
                product = await self.product_repo.get(item.product_id)
                if product:
                    product.stock_quantity += item.quantity
                    movement = POSStockMovement(
                        company_id=company_id,
                        product_id=item.product_id,
                        movement_type="return",
                        quantity=item.quantity,
                        reference_type="transaction",
                        reference_id=str(transaction_id),
                        notes="Stock restored on cancellation",
                        created_by_id=created_by_id,
                    )
                    await self.inventory_repo.add_movement(movement)

        await self.transaction_repo.commit()
        return transaction

    async def create_return(
        self,
        company_id: str,
        transaction_id: str,
        created_by_id: str,
        items: list[dict],
        refund_method: str,
        reason: str | None = None,
    ) -> POSReturn:
        """Create a return for a transaction."""
        transaction = await self.get_transaction(transaction_id, company_id)

        refund_amount = Decimal("0")
        for item in items:
            refund_amount += Decimal(str(item.get("refund_amount", 0)))

        ret = POSReturn(
            company_id=company_id,
            transaction_id=transaction_id,
            reason=reason,
            refund_amount=refund_amount,
            refund_method=refund_method,
            created_by_id=created_by_id,
        )
        ret = await self.transaction_repo.add_return(ret)

        # Process return items and restore stock
        for item in items:
            product_id = item.get("product_id")
            variant_id = item.get("variant_id")
            quantity = item.get("quantity", 1)
            item_refund = Decimal(str(item.get("refund_amount", 0)))

            return_item = POSReturnItem(
                return_id=ret.id,
                transaction_item_id=item.get("transaction_item_id", ""),
                product_id=product_id,
                variant_id=variant_id,
                quantity=quantity,
                refund_amount=item_refund,
            )
            await self.transaction_repo.add_return_item(return_item)

            # Restore stock
            if variant_id:
                variant = await self.product_repo.session.get(POSProductVariant, variant_id)
                if variant:
                    variant.stock_quantity += quantity
                    movement = POSStockMovement(
                        company_id=company_id,
                        product_id=product_id,
                        variant_id=variant_id,
                        movement_type="return",
                        quantity=quantity,
                        reference_type="return",
                        reference_id=str(ret.id),
                        created_by_id=created_by_id,
                    )
                    await self.inventory_repo.add_movement(movement)
            else:
                product = await self.product_repo.get(product_id)
                if product:
                    product.stock_quantity += quantity
                    movement = POSStockMovement(
                        company_id=company_id,
                        product_id=product_id,
                        movement_type="return",
                        quantity=quantity,
                        reference_type="return",
                        reference_id=str(ret.id),
                        created_by_id=created_by_id,
                    )
                    await self.inventory_repo.add_movement(movement)

        await self.transaction_repo.commit()
        return ret

    async def get_receipt_html(self, transaction_id: str, company_id: str) -> dict:
        """Get transaction data for receipt generation."""
        transaction = await self.get_transaction(transaction_id, company_id)
        items = await self.transaction_repo.get_items(transaction_id)
        return {
            "transaction": transaction,
            "items": items,
        }

    async def save(self) -> None:
        """Commit pending changes."""
        await self.transaction_repo.commit()
