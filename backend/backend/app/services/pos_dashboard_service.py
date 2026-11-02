from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pos_transaction import POSTransaction
from app.models.pos_transaction_item import POSTransactionItem
from app.models.pos_product import POSProduct
from app.repositories.pos_transaction_repository import POSTransactionRepository
from app.repositories.pos_inventory_repository import POSInventoryRepository


class POSDashboardService:
    """Service layer for POS dashboard data."""

    def __init__(self, session: AsyncSession) -> None:
        self.transaction_repo = POSTransactionRepository(session)
        self.inventory_repo = POSInventoryRepository(session)

    async def get_dashboard_data(self, company_id: str) -> dict:
        """Get complete dashboard data for a company."""
        today = date.today()

        # Today's stats
        today_stats = await self.transaction_repo.get_today_stats(company_id, today)

        # Inventory summary
        inventory_summary = await self.inventory_repo.get_inventory_summary(company_id)

        # Low stock products
        low_stock = await self.inventory_repo.get_low_stock_products(company_id)

        # Top selling products (today)
        tomorrow = today + __import__('datetime').timedelta(days=1)
        from sqlalchemy import select
        result = await self.transaction_repo.session.execute(
            select(
                POSTransactionItem.product_name,
                func.sum(POSTransactionItem.quantity).label("total_qty"),
                func.sum(POSTransactionItem.line_total).label("total_revenue"),
            )
            .join(POSTransaction, POSTransactionItem.transaction_id == POSTransaction.id)
            .where(
                and_(
                    POSTransaction.company_id == company_id,
                    POSTransaction.created_at >= today,
                    POSTransaction.created_at < tomorrow,
                    POSTransaction.status == "completed",
                )
            )
            .group_by(POSTransactionItem.product_name)
            .order_by(func.sum(POSTransactionItem.quantity).desc())
            .limit(5)
        )
        top_products = []
        for row in result.all():
            top_products.append({
                "product_name": row[0],
                "quantity_sold": row[1],
                "revenue": row[2],
            })

        # Payment method breakdown (today)
        result = await self.transaction_repo.session.execute(
            select(
                POSTransaction.payment_method,
                func.count(POSTransaction.id).label("count"),
                func.coalesce(func.sum(POSTransaction.payment_amount), 0).label("total"),
            ).where(
                and_(
                    POSTransaction.company_id == company_id,
                    POSTransaction.created_at >= today,
                    POSTransaction.created_at < tomorrow,
                    POSTransaction.status == "completed",
                )
            ).group_by(POSTransaction.payment_method)
        )
        payment_breakdown = []
        for row in result.all():
            payment_breakdown.append({
                "method": row[0],
                "count": row[1],
                "total": row[2],
            })

        # Recent transactions
        recent = await self.transaction_repo.list_by_company(company_id, limit=10)

        return {
            "today_sales": {
                "transactions": today_stats["count"],
                "revenue": today_stats["revenue"],
                "discount": today_stats["discount"],
                "tax": today_stats["tax"],
            },
            "inventory": inventory_summary,
            "low_stock_products": [
                {"id": str(p.id), "name": p.name, "sku": p.sku, "stock": p.stock_quantity, "threshold": p.low_stock_threshold}
                for p in low_stock
            ],
            "top_products": top_products,
            "payment_breakdown": payment_breakdown,
            "recent_transactions": [
                {
                    "id": str(t.id),
                    "transaction_number": t.transaction_number,
                    "grand_total": t.grand_total,
                    "payment_method": t.payment_method,
                    "status": t.status,
                    "created_at": t.created_at,
                }
                for t in recent[:10]
            ],
        }
