from __future__ import annotations

import uuid
import csv
import logging
from io import StringIO
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session, require_business_profile
from app.models.company import Company
from app.models.role import Role
from app.models.sales_inventory import (
    SalesInventoryDealer,
    SalesInventoryInvoice,
    SalesInventoryNotification,
    SalesInventoryOrder,
    SalesInventoryOrderHistory,
    SalesInventoryOrderItem,
    SalesInventoryProduct,
    SalesInventoryStock,
    SalesInventoryTransaction,
)
from app.models.user import User
from app.schemas.sales_inventory import (
    DealerCreate,
    DealerUpdate,
    InventoryAdjustment,
    OrderCreate,
    OrderReject,
    OrderStatusUpdate,
    OrderUpdate,
    ProductCreate,
    ProductUpdate,
)
from app.services.email_service import EmailConfigurationError, EmailDeliveryError, EmailService
from app.utils.pdf_generator import generate_pdf_from_data

router = APIRouter(
    prefix="/sales-inventory",
    tags=["Sales & Inventory"],
    dependencies=[Depends(require_business_profile("sales_inventory"))],
)
logger = logging.getLogger(__name__)

CENT = Decimal("0.01")
ZERO = Decimal("0")


def _tenant_id(current_user: dict[str, str], admin_only: bool = False) -> uuid.UUID:
    if current_user.get("role") not in {"Admin", "Sales"}:
        raise HTTPException(status_code=403, detail="Only Admin and Sales roles can use this workspace.")
    if admin_only and current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access is required for this action.")
    try:
        return uuid.UUID(current_user["company_id"])
    except (KeyError, ValueError, TypeError) as error:
        raise HTTPException(status_code=403, detail="Complete organization setup before using this workspace.") from error


async def _notify(
    session: AsyncSession,
    company_id: uuid.UUID,
    event_type: str,
    message: str,
    resource_id: uuid.UUID,
    recipient_id: uuid.UUID | None = None,
) -> None:
    if recipient_id is not None:
        session.add(
            SalesInventoryNotification(
                company_id=company_id,
                user_id=recipient_id,
                event_type=event_type,
                message=message,
                resource_id=resource_id,
            )
        )
        return
    statement = (
        select(User.id)
        .join(Role, Role.id == User.role_id)
        .where(
            User.company_id == company_id,
            User.is_active.is_(True),
            Role.name == "Admin",
        )
    )
    admin_ids = (await session.execute(statement)).scalars().all()
    for user_id in admin_ids:
        session.add(
            SalesInventoryNotification(
                company_id=company_id,
                user_id=user_id,
                event_type=event_type,
                message=message,
                resource_id=resource_id,
            )
        )


async def _get_order(
    session: AsyncSession, order_id: uuid.UUID, company_id: uuid.UUID, for_update: bool = False
) -> SalesInventoryOrder:
    statement = select(SalesInventoryOrder).where(
        SalesInventoryOrder.id == order_id,
        SalesInventoryOrder.company_id == company_id,
    )
    if for_update:
        statement = statement.with_for_update()
    order = (await session.execute(statement)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order


async def _order_data(
    session: AsyncSession, order: SalesInventoryOrder
) -> dict:
    dealer = await session.get(SalesInventoryDealer, order.dealer_id)
    rep = await session.get(User, order.sales_rep_id)
    items = (
        await session.execute(
            select(SalesInventoryOrderItem).where(SalesInventoryOrderItem.order_id == order.id)
        )
    ).scalars().all()
    invoice = (
        await session.execute(
            select(SalesInventoryInvoice).where(SalesInventoryInvoice.order_id == order.id)
        )
    ).scalar_one_or_none()
    history = (
        await session.execute(
            select(SalesInventoryOrderHistory)
            .where(SalesInventoryOrderHistory.order_id == order.id)
            .order_by(SalesInventoryOrderHistory.created_at)
        )
    ).scalars().all()
    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "dealer_id": str(order.dealer_id),
        "dealer_name": dealer.name if dealer else "Unavailable dealer",
        "sales_rep_id": str(order.sales_rep_id),
        "sales_rep_name": rep.username if rep else "Unavailable user",
        "status": order.status,
        "total_amount": str(order.total_amount),
        "notes": order.notes,
        "rejection_reason": order.rejection_reason,
        "approved_at": order.approved_at.isoformat() if order.approved_at else None,
        "invoice": (
            {"id": str(invoice.id), "invoice_number": invoice.invoice_number}
            if invoice
            else None
        ),
        "history": [
            {
                "from_status": item.from_status,
                "to_status": item.to_status,
                "note": item.note,
                "created_at": item.created_at.isoformat(),
            }
            for item in history
        ],
        "created_at": order.created_at.isoformat(),
        "items": [
            {
                "id": str(item.id),
                "product_id": str(item.product_id),
                "product_code": item.product_code,
                "product_name": item.product_name,
                "unit": item.unit,
                "quantity": str(item.quantity),
                "unit_price": str(item.unit_price),
                "line_total": str(item.line_total),
            }
            for item in items
        ],
    }


async def _product_data(session: AsyncSession, product: SalesInventoryProduct) -> dict:
    stock = (
        await session.execute(
            select(SalesInventoryStock.quantity).where(
                SalesInventoryStock.company_id == product.company_id,
                SalesInventoryStock.product_id == product.id,
            )
        )
    ).scalar_one_or_none()
    return {
        "id": str(product.id),
        "product_code": product.product_code,
        "name": product.name,
        "category": product.category,
        "description": product.description,
        "unit": product.unit,
        "unit_price": str(product.unit_price),
        "reorder_level": str(product.reorder_level),
        "quantity": str(stock if stock is not None else ZERO),
        "is_active": product.is_active,
    }


@router.get("/summary")
async def get_summary(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user)
    order_scope = [SalesInventoryOrder.company_id == company_id]
    if current_user["role"] == "Sales":
        order_scope.append(SalesInventoryOrder.sales_rep_id == uuid.UUID(current_user["id"]))
    status_rows = (
        await session.execute(
            select(SalesInventoryOrder.status, func.count(SalesInventoryOrder.id))
            .where(*order_scope)
            .group_by(SalesInventoryOrder.status)
        )
    ).all()
    sales_total = (
        await session.execute(
            select(func.coalesce(func.sum(SalesInventoryOrder.total_amount), 0)).where(
                *order_scope,
                SalesInventoryOrder.status.in_(["Approved", "Processing", "Dispatched", "Delivered"]),
            )
        )
    ).scalar_one()
    product_rows = (
        await session.execute(
            select(SalesInventoryProduct, SalesInventoryStock.quantity)
            .outerjoin(
                SalesInventoryStock,
                (SalesInventoryStock.product_id == SalesInventoryProduct.id)
                & (SalesInventoryStock.company_id == company_id),
            )
            .where(
                SalesInventoryProduct.company_id == company_id,
                SalesInventoryProduct.is_active.is_(True),
            )
        )
    ).all()
    low_stock = [
        {
            "id": str(product.id),
            "name": product.name,
            "product_code": product.product_code,
            "quantity": str(quantity if quantity is not None else ZERO),
            "reorder_level": str(product.reorder_level),
            "unit": product.unit,
        }
        for product, quantity in product_rows
        if (quantity if quantity is not None else ZERO) <= product.reorder_level
    ]
    recent_statement = (
        select(SalesInventoryOrder)
        .where(*order_scope)
        .order_by(SalesInventoryOrder.created_at.desc())
        .limit(8)
    )
    recent = (await session.execute(recent_statement)).scalars().all()
    return {
        "orders_by_status": {row[0]: row[1] for row in status_rows},
        "sales_total": str(sales_total),
        "dealer_count": await session.scalar(
            select(func.count(SalesInventoryDealer.id)).where(
                SalesInventoryDealer.company_id == company_id,
                SalesInventoryDealer.is_active.is_(True),
            )
        ),
        "product_count": len(product_rows),
        "low_stock": low_stock,
        "recent_orders": [await _order_data(session, order) for order in recent],
    }


@router.get("/dealers")
async def list_dealers(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user)
    dealers = (
        await session.execute(
            select(SalesInventoryDealer)
            .where(SalesInventoryDealer.company_id == company_id)
            .order_by(SalesInventoryDealer.name)
        )
    ).scalars().all()
    return [
        {
            "id": str(item.id),
            "dealer_code": item.dealer_code,
            "name": item.name,
            "contact_name": item.contact_name,
            "email": item.email,
            "phone_number": item.phone_number,
            "address": item.address,
            "gstin": item.gstin,
            "territory": item.territory,
            "is_active": item.is_active,
        }
        for item in dealers
    ]


@router.post("/dealers", status_code=status.HTTP_201_CREATED)
async def create_dealer(
    payload: DealerCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user)
    dealer = SalesInventoryDealer(
        company_id=company_id,
        created_by_id=uuid.UUID(current_user["id"]),
        **payload.model_dump(),
    )
    session.add(dealer)
    await session.commit()
    await session.refresh(dealer)
    return {
        "id": str(dealer.id),
        **payload.model_dump(),
        "is_active": dealer.is_active,
    }


@router.patch("/dealers/{dealer_id}")
async def update_dealer(
    dealer_id: uuid.UUID,
    payload: DealerUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user)
    dealer = (
        await session.execute(
            select(SalesInventoryDealer).where(
                SalesInventoryDealer.id == dealer_id,
                SalesInventoryDealer.company_id == company_id,
            )
        )
    ).scalar_one_or_none()
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(dealer, key, value)
    await session.commit()
    await session.refresh(dealer)
    return {
        "id": str(dealer.id),
        "dealer_code": dealer.dealer_code,
        "name": dealer.name,
        "contact_name": dealer.contact_name,
        "email": dealer.email,
        "phone_number": dealer.phone_number,
        "address": dealer.address,
        "gstin": dealer.gstin,
        "territory": dealer.territory,
        "is_active": dealer.is_active,
    }


@router.get("/products")
async def list_products(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user)
    products = (
        await session.execute(
            select(SalesInventoryProduct)
            .where(SalesInventoryProduct.company_id == company_id)
            .order_by(SalesInventoryProduct.name)
        )
    ).scalars().all()
    return [await _product_data(session, product) for product in products]


@router.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user, admin_only=True)
    product = SalesInventoryProduct(
        company_id=company_id,
        created_by_id=uuid.UUID(current_user["id"]),
        **payload.model_dump(exclude={"opening_stock"}),
    )
    session.add(product)
    await session.flush()
    stock = SalesInventoryStock(
        company_id=company_id,
        product_id=product.id,
        quantity=payload.opening_stock,
    )
    session.add(stock)
    if payload.opening_stock > ZERO:
        session.add(
            SalesInventoryTransaction(
                company_id=company_id,
                product_id=product.id,
                actor_id=uuid.UUID(current_user["id"]),
                transaction_type="Purchase",
                quantity_delta=payload.opening_stock,
                balance_after=payload.opening_stock,
                reason="Opening stock recorded when product was created.",
            )
        )
    await session.commit()
    await session.refresh(product)
    return await _product_data(session, product)


@router.patch("/products/{product_id}")
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user, admin_only=True)
    product = (
        await session.execute(
            select(SalesInventoryProduct).where(
                SalesInventoryProduct.id == product_id,
                SalesInventoryProduct.company_id == company_id,
            )
        )
    ).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    await session.commit()
    await session.refresh(product)
    return await _product_data(session, product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    company_id = _tenant_id(current_user, admin_only=True)
    product = (
        await session.execute(
            select(SalesInventoryProduct).where(
                SalesInventoryProduct.id == product_id,
                SalesInventoryProduct.company_id == company_id,
            )
        )
    ).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    product.is_active = False
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/inventory")
async def list_inventory(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user)
    rows = (
        await session.execute(
            select(SalesInventoryProduct, SalesInventoryStock.quantity)
            .outerjoin(
                SalesInventoryStock,
                (SalesInventoryStock.product_id == SalesInventoryProduct.id)
                & (SalesInventoryStock.company_id == company_id),
            )
            .where(
                SalesInventoryProduct.company_id == company_id,
                SalesInventoryProduct.is_active.is_(True),
            )
            .order_by(SalesInventoryProduct.name)
        )
    ).all()
    return [
        {
            "product_id": str(product.id),
            "product_code": product.product_code,
            "product_name": product.name,
            "unit": product.unit,
            "quantity": str(quantity if quantity is not None else ZERO),
            "reorder_level": str(product.reorder_level),
        }
        for product, quantity in rows
    ]


@router.get("/inventory/transactions")
async def list_inventory_transactions(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user, admin_only=True)
    rows = (
        await session.execute(
            select(SalesInventoryTransaction, SalesInventoryProduct.name, SalesInventoryProduct.unit)
            .join(SalesInventoryProduct, SalesInventoryProduct.id == SalesInventoryTransaction.product_id)
            .where(SalesInventoryTransaction.company_id == company_id)
            .order_by(SalesInventoryTransaction.created_at.desc())
            .limit(500)
        )
    ).all()
    return [
        {
            "id": str(transaction.id),
            "product_name": product_name,
            "unit": unit,
            "transaction_type": transaction.transaction_type,
            "quantity_delta": str(transaction.quantity_delta),
            "balance_after": str(transaction.balance_after),
            "reason": transaction.reason,
            "created_at": transaction.created_at.isoformat(),
        }
        for transaction, product_name, unit in rows
    ]


@router.post("/inventory/adjustments", status_code=status.HTTP_201_CREATED)
async def adjust_inventory(
    payload: InventoryAdjustment,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user, admin_only=True)
    product = (
        await session.execute(
            select(SalesInventoryProduct).where(
                SalesInventoryProduct.id == payload.product_id,
                SalesInventoryProduct.company_id == company_id,
                SalesInventoryProduct.is_active.is_(True),
            )
        )
    ).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if payload.transaction_type in {"Purchase", "Return"} and payload.quantity_delta < 0:
        raise HTTPException(status_code=422, detail="Purchase and Return quantities must increase stock.")
    stock = (
        await session.execute(
            select(SalesInventoryStock)
            .where(
                SalesInventoryStock.company_id == company_id,
                SalesInventoryStock.product_id == product.id,
            )
            .with_for_update()
        )
    ).scalar_one_or_none()
    if not stock:
        stock = SalesInventoryStock(company_id=company_id, product_id=product.id, quantity=ZERO)
        session.add(stock)
        await session.flush()
    new_quantity = stock.quantity + payload.quantity_delta
    if new_quantity < 0:
        raise HTTPException(status_code=409, detail="This adjustment would make stock negative.")
    stock.quantity = new_quantity
    transaction = SalesInventoryTransaction(
        company_id=company_id,
        product_id=product.id,
        actor_id=uuid.UUID(current_user["id"]),
        transaction_type=payload.transaction_type,
        quantity_delta=payload.quantity_delta,
        balance_after=new_quantity,
        reason=payload.reason,
    )
    session.add(transaction)
    if new_quantity <= product.reorder_level:
        existing_alert = (
            await session.execute(
                select(SalesInventoryNotification.id).where(
                    SalesInventoryNotification.company_id == company_id,
                    SalesInventoryNotification.event_type == "low_stock",
                    SalesInventoryNotification.resource_id == product.id,
                    SalesInventoryNotification.is_read.is_(False),
                ).limit(1)
            )
        ).scalar_one_or_none()
        if not existing_alert:
            await _notify(
                session,
                company_id,
                "low_stock",
                f"{product.name} is at or below its reorder level ({new_quantity} {product.unit}).",
                product.id,
            )
    else:
        await session.execute(
            SalesInventoryNotification.__table__.update()
            .where(
                SalesInventoryNotification.company_id == company_id,
                SalesInventoryNotification.event_type == "low_stock",
                SalesInventoryNotification.resource_id == product.id,
            )
            .values(is_read=True)
        )
    await session.commit()
    await session.refresh(transaction)
    return {
        "id": str(transaction.id),
        "product_id": str(product.id),
        "quantity": str(new_quantity),
        "quantity_delta": str(payload.quantity_delta),
        "transaction_type": payload.transaction_type,
    }


@router.get("/orders")
async def list_orders(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user)
    statement = select(SalesInventoryOrder).where(SalesInventoryOrder.company_id == company_id)
    if current_user["role"] == "Sales":
        statement = statement.where(
            SalesInventoryOrder.sales_rep_id == uuid.UUID(current_user["id"])
        )
    orders = (await session.execute(statement.order_by(SalesInventoryOrder.created_at.desc()))).scalars().all()
    return [await _order_data(session, order) for order in orders]


@router.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user)
    dealer = (
        await session.execute(
            select(SalesInventoryDealer).where(
                SalesInventoryDealer.id == payload.dealer_id,
                SalesInventoryDealer.company_id == company_id,
                SalesInventoryDealer.is_active.is_(True),
            )
        )
    ).scalar_one_or_none()
    if not dealer:
        raise HTTPException(status_code=404, detail="Active dealer not found.")
    order = SalesInventoryOrder(
        company_id=company_id,
        dealer_id=dealer.id,
        sales_rep_id=uuid.UUID(current_user["id"]),
        order_number=f"SO-{uuid.uuid4().hex[:10].upper()}",
        status="Pending Approval" if payload.submit else "Draft",
        total_amount=ZERO,
        notes=payload.notes,
    )
    session.add(order)
    await session.flush()

    requested: dict[uuid.UUID, Decimal] = defaultdict(lambda: ZERO)
    for item in payload.items:
        requested[item.product_id] += item.quantity
    products = (
        await session.execute(
            select(SalesInventoryProduct).where(
                SalesInventoryProduct.company_id == company_id,
                SalesInventoryProduct.id.in_(requested.keys()),
                SalesInventoryProduct.is_active.is_(True),
            )
        )
    ).scalars().all()
    products_by_id = {product.id: product for product in products}
    if len(products_by_id) != len(requested):
        raise HTTPException(status_code=422, detail="One or more products are unavailable in this organization.")

    total = ZERO
    for product_id, quantity in requested.items():
        product = products_by_id[product_id]
        line_total = (product.unit_price * quantity).quantize(CENT, rounding=ROUND_HALF_UP)
        total += line_total
        session.add(
            SalesInventoryOrderItem(
                order_id=order.id,
                product_id=product.id,
                product_code=product.product_code,
                product_name=product.name,
                unit=product.unit,
                quantity=quantity,
                unit_price=product.unit_price,
                line_total=line_total,
            )
        )
    order.total_amount = total.quantize(CENT, rounding=ROUND_HALF_UP)
    admin_recipients: list[tuple[str, str]] = []
    if order.status == "Pending Approval":
        await _notify(
            session,
            company_id,
            "new_order",
            f"Order {order.order_number} is waiting for approval.",
            order.id,
        )
        admin_recipients = list(
            (
                await session.execute(
                    select(User.email, User.username)
                    .join(Role, Role.id == User.role_id)
                    .where(
                        User.company_id == company_id,
                        User.business_profile == "sales_inventory",
                        User.is_active.is_(True),
                        Role.name == "Admin",
                    )
                )
            ).all()
        )
    session.add(
        SalesInventoryOrderHistory(
            order_id=order.id,
            actor_id=uuid.UUID(current_user["id"]),
            from_status=None,
            to_status=order.status,
            note="Order created",
        )
    )
    await session.commit()
    await session.refresh(order)
    if order.status == "Pending Approval":
        email_service = EmailService()
        email_items = [
            {
                "product_name": products_by_id[product_id].name,
                "quantity": str(quantity),
                "unit": products_by_id[product_id].unit,
            }
            for product_id, quantity in requested.items()
        ]
        for recipient, admin_name in admin_recipients:
            try:
                await email_service.send_sales_order_alert_email(
                    recipient=recipient,
                    order_number=order.order_number,
                    dealer_name=dealer.name,
                    sales_rep_name=current_user.get("username", "Sales representative"),
                    total_amount=str(order.total_amount),
                    items=email_items,
                )
            except EmailConfigurationError:
                logger.warning("Sales order alert email is not configured; skipping email notification.")
                break
            except EmailDeliveryError as error:
                logger.error(
                    "Sales order alert email delivery failed for admin %s: %s",
                    admin_name,
                    error,
                )
    return await _order_data(session, order)


@router.patch("/orders/{order_id}")
async def update_order(
    order_id: uuid.UUID,
    payload: OrderUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user)
    order = await _get_order(session, order_id, company_id, for_update=True)
    if current_user["role"] == "Sales" and order.sales_rep_id != uuid.UUID(current_user["id"]):
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.status not in {"Draft", "Rejected"}:
        raise HTTPException(status_code=409, detail="Only draft or rejected orders can be edited.")
    previous_status = order.status
    changes = payload.model_dump(exclude_unset=True)
    if "dealer_id" in changes:
        dealer = (
            await session.execute(
                select(SalesInventoryDealer).where(
                    SalesInventoryDealer.id == changes["dealer_id"],
                    SalesInventoryDealer.company_id == company_id,
                    SalesInventoryDealer.is_active.is_(True),
                )
            )
        ).scalar_one_or_none()
        if not dealer:
            raise HTTPException(status_code=404, detail="Active dealer not found.")
        order.dealer_id = dealer.id
    if "notes" in changes:
        order.notes = changes["notes"]
    if changes.get("items") is not None:
        requested: dict[uuid.UUID, Decimal] = defaultdict(lambda: ZERO)
        for item in changes["items"]:
            requested[item["product_id"]] += item["quantity"]
        products = (
            await session.execute(
                select(SalesInventoryProduct).where(
                    SalesInventoryProduct.company_id == company_id,
                    SalesInventoryProduct.id.in_(requested.keys()),
                    SalesInventoryProduct.is_active.is_(True),
                )
            )
        ).scalars().all()
        products_by_id = {product.id: product for product in products}
        if len(products_by_id) != len(requested):
            raise HTTPException(status_code=422, detail="One or more products are unavailable in this organization.")
        old_items = (
            await session.execute(
                select(SalesInventoryOrderItem).where(SalesInventoryOrderItem.order_id == order.id)
            )
        ).scalars().all()
        for item in old_items:
            await session.delete(item)
        await session.flush()
        total = ZERO
        for product_id, quantity in requested.items():
            product = products_by_id[product_id]
            line_total = (product.unit_price * quantity).quantize(CENT, rounding=ROUND_HALF_UP)
            total += line_total
            session.add(
                SalesInventoryOrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_code=product.product_code,
                    product_name=product.name,
                    unit=product.unit,
                    quantity=quantity,
                    unit_price=product.unit_price,
                    line_total=line_total,
                )
            )
        order.total_amount = total.quantize(CENT, rounding=ROUND_HALF_UP)
    if previous_status == "Rejected":
        order.status = "Draft"
        order.rejection_reason = None
        session.add(
            SalesInventoryOrderHistory(
                order_id=order.id,
                actor_id=uuid.UUID(current_user["id"]),
                from_status="Rejected",
                to_status="Draft",
                note="Order revised after rejection",
            )
        )
    await session.commit()
    return await _order_data(session, order)


@router.post("/orders/{order_id}/submit")
async def submit_order(
    order_id: uuid.UUID,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user)
    order = await _get_order(session, order_id, company_id, for_update=True)
    if current_user["role"] == "Sales" and order.sales_rep_id != uuid.UUID(current_user["id"]):
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.status != "Draft":
        raise HTTPException(status_code=409, detail="Only draft orders can be submitted.")
    order.status = "Pending Approval"
    session.add(
        SalesInventoryOrderHistory(
            order_id=order.id,
            actor_id=uuid.UUID(current_user["id"]),
            from_status="Draft",
            to_status="Pending Approval",
        )
    )
    await _notify(
        session,
        company_id,
        "new_order",
        f"Order {order.order_number} is waiting for approval.",
        order.id,
    )
    await session.commit()
    return await _order_data(session, order)


@router.post("/orders/{order_id}/approve")
async def approve_order(
    order_id: uuid.UUID,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user, admin_only=True)
    order = await _get_order(session, order_id, company_id, for_update=True)
    if order.status != "Pending Approval":
        raise HTTPException(status_code=409, detail="Only pending orders can be approved.")
    items = (
        await session.execute(
            select(SalesInventoryOrderItem).where(SalesInventoryOrderItem.order_id == order.id)
        )
    ).scalars().all()
    requested: dict[uuid.UUID, Decimal] = defaultdict(lambda: ZERO)
    for item in items:
        requested[item.product_id] += item.quantity
    stock_rows = (
        await session.execute(
            select(SalesInventoryStock)
            .where(
                SalesInventoryStock.company_id == company_id,
                SalesInventoryStock.product_id.in_(sorted(requested, key=str)),
            )
            .order_by(SalesInventoryStock.product_id)
            .with_for_update()
        )
    ).scalars().all()
    stock_by_product = {row.product_id: row for row in stock_rows}
    product_rows = (
        await session.execute(
            select(SalesInventoryProduct).where(
                SalesInventoryProduct.company_id == company_id,
                SalesInventoryProduct.id.in_(requested.keys()),
            )
        )
    ).scalars().all()
    products_by_id = {product.id: product for product in product_rows}
    product_names = {product.id: product.name for product in product_rows}
    insufficient = [
        {
            "product_id": str(product_id),
            "product_name": product_names.get(product_id, "Product"),
            "requested": str(quantity),
            "available": str(stock_by_product[product_id].quantity if product_id in stock_by_product else ZERO),
        }
        for product_id, quantity in requested.items()
        if product_id not in stock_by_product or stock_by_product[product_id].quantity < quantity
    ]
    if insufficient:
        raise HTTPException(
            status_code=409,
            detail={"code": "INSUFFICIENT_STOCK", "message": "Order cannot be approved until stock is available.", "items": insufficient},
        )
    for product_id, quantity in requested.items():
        stock = stock_by_product[product_id]
        stock.quantity -= quantity
        session.add(
            SalesInventoryTransaction(
                company_id=company_id,
                product_id=product_id,
                order_id=order.id,
                actor_id=uuid.UUID(current_user["id"]),
                transaction_type="Order Approval",
                quantity_delta=-quantity,
                balance_after=stock.quantity,
                reason=f"Approved order {order.order_number}",
            )
        )
        product = products_by_id.get(product_id)
        if product and stock.quantity <= product.reorder_level:
            existing_alert = (
                await session.execute(
                    select(SalesInventoryNotification.id)
                    .where(
                        SalesInventoryNotification.company_id == company_id,
                        SalesInventoryNotification.event_type == "low_stock",
                        SalesInventoryNotification.resource_id == product.id,
                        SalesInventoryNotification.is_read.is_(False),
                    )
                    .limit(1)
                )
            ).scalar_one_or_none()
            if not existing_alert:
                await _notify(
                    session,
                    company_id,
                    "low_stock",
                    f"{product.name} is at or below its reorder level ({stock.quantity} {product.unit}).",
                    product.id,
                )
    order.status = "Approved"
    order.approved_by_id = uuid.UUID(current_user["id"])
    order.approved_at = datetime.now(timezone.utc)
    session.add(
        SalesInventoryOrderHistory(
            order_id=order.id,
            actor_id=uuid.UUID(current_user["id"]),
            from_status="Pending Approval",
            to_status="Approved",
        )
    )
    invoice = SalesInventoryInvoice(
        company_id=company_id,
        order_id=order.id,
        invoice_number=f"SI-INV-{uuid.uuid4().hex[:10].upper()}",
        total_amount=order.total_amount,
    )
    session.add(invoice)
    await _notify(
        session,
        company_id,
        "order_approved",
        f"Order {order.order_number} was approved.",
        order.id,
        recipient_id=order.sales_rep_id,
    )
    await session.commit()
    return await _order_data(session, order)


@router.post("/orders/{order_id}/reject")
async def reject_order(
    order_id: uuid.UUID,
    payload: OrderReject,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user, admin_only=True)
    order = await _get_order(session, order_id, company_id, for_update=True)
    if order.status != "Pending Approval":
        raise HTTPException(status_code=409, detail="Only pending orders can be rejected.")
    order.status = "Rejected"
    order.rejection_reason = payload.reason
    session.add(
        SalesInventoryOrderHistory(
            order_id=order.id,
            actor_id=uuid.UUID(current_user["id"]),
            from_status="Pending Approval",
            to_status="Rejected",
            note=payload.reason,
        )
    )
    await _notify(
        session,
        company_id,
        "order_rejected",
        f"Order {order.order_number} was rejected: {payload.reason}",
        order.id,
        recipient_id=order.sales_rep_id,
    )
    await session.commit()
    return await _order_data(session, order)


@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: uuid.UUID,
    payload: OrderStatusUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user)
    order = await _get_order(session, order_id, company_id, for_update=True)
    if payload.status != "Cancelled" and current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can update fulfillment status.")
    allowed = {
        "Approved": {"Processing"},
        "Processing": {"Dispatched"},
        "Dispatched": {"Delivered"},
    }
    if payload.status == "Cancelled" and order.status in {"Draft", "Pending Approval"}:
        if current_user["role"] == "Sales" and order.sales_rep_id != uuid.UUID(current_user["id"]):
            raise HTTPException(status_code=404, detail="Order not found.")
        allowed_status = True
    else:
        allowed_status = payload.status in allowed.get(order.status, set())
    if not allowed_status:
        raise HTTPException(
            status_code=409,
            detail=f"Order cannot move from {order.status} to {payload.status}.",
        )
    previous_status = order.status
    order.status = payload.status
    session.add(
        SalesInventoryOrderHistory(
            order_id=order.id,
            actor_id=uuid.UUID(current_user["id"]),
            from_status=previous_status,
            to_status=payload.status,
        )
    )
    if payload.status in {"Dispatched", "Delivered"}:
        await _notify(
            session,
            company_id,
            "dispatch" if payload.status == "Dispatched" else "delivery",
            f"Order {order.order_number} was marked {payload.status.lower()}.",
            order.id,
            recipient_id=order.sales_rep_id,
        )
    await session.commit()
    return await _order_data(session, order)


@router.get("/reports/sales")
async def sales_report(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    company_id = _tenant_id(current_user)
    filters = [
        SalesInventoryOrder.company_id == company_id,
        SalesInventoryOrder.status.in_(["Approved", "Processing", "Dispatched", "Delivered"]),
    ]
    if current_user["role"] == "Sales":
        filters.append(SalesInventoryOrder.sales_rep_id == uuid.UUID(current_user["id"]))
    totals = (
        await session.execute(
            select(
                func.count(SalesInventoryOrder.id),
                func.coalesce(func.sum(SalesInventoryOrder.total_amount), 0),
            ).where(*filters)
        )
    ).one()
    status_filters = [SalesInventoryOrder.company_id == company_id]
    if current_user["role"] == "Sales":
        status_filters.append(SalesInventoryOrder.sales_rep_id == uuid.UUID(current_user["id"]))
    by_status = (
        await session.execute(
            select(SalesInventoryOrder.status, func.count(SalesInventoryOrder.id))
            .where(*status_filters)
            .group_by(SalesInventoryOrder.status)
        )
    ).all()
    product_sales = (
        await session.execute(
            select(
                SalesInventoryOrderItem.product_id,
                SalesInventoryOrderItem.product_code,
                SalesInventoryOrderItem.product_name,
                SalesInventoryOrderItem.unit,
                func.sum(SalesInventoryOrderItem.quantity),
                func.sum(SalesInventoryOrderItem.line_total),
            )
            .join(SalesInventoryOrder, SalesInventoryOrder.id == SalesInventoryOrderItem.order_id)
            .where(*filters)
            .group_by(
                SalesInventoryOrderItem.product_id,
                SalesInventoryOrderItem.product_code,
                SalesInventoryOrderItem.product_name,
                SalesInventoryOrderItem.unit,
            )
            .order_by(func.sum(SalesInventoryOrderItem.line_total).desc())
            .limit(20)
        )
    ).all()
    return {
        "approved_order_count": totals[0],
        "approved_sales_total": str(totals[1]),
        "orders_by_status": {row[0]: row[1] for row in by_status},
        "product_sales": [
            {
                "product_id": str(row[0]),
                "product_code": row[1],
                "product_name": row[2],
                "unit": row[3],
                "quantity": str(row[4]),
                "sales_total": str(row[5]),
            }
            for row in product_sales
        ],
    }


@router.get("/reports/dealer-sales")
async def dealer_sales_report(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user)
    filters = [
        SalesInventoryOrder.company_id == company_id,
        SalesInventoryOrder.status.in_(["Approved", "Processing", "Dispatched", "Delivered"]),
    ]
    if current_user["role"] == "Sales":
        filters.append(SalesInventoryOrder.sales_rep_id == uuid.UUID(current_user["id"]))
    rows = (
        await session.execute(
            select(
                SalesInventoryDealer.id,
                SalesInventoryDealer.name,
                func.count(SalesInventoryOrder.id),
                func.sum(SalesInventoryOrder.total_amount),
            )
            .join(SalesInventoryOrder, SalesInventoryOrder.dealer_id == SalesInventoryDealer.id)
            .where(*filters)
            .group_by(SalesInventoryDealer.id, SalesInventoryDealer.name)
            .order_by(func.sum(SalesInventoryOrder.total_amount).desc())
        )
    ).all()
    return [
        {
            "dealer_id": str(row[0]),
            "dealer_name": row[1],
            "order_count": row[2],
            "sales_total": str(row[3] or ZERO),
        }
        for row in rows
    ]


@router.get("/reports/rep-performance")
async def rep_performance_report(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user)
    filters = [
        SalesInventoryOrder.company_id == company_id,
        SalesInventoryOrder.status.in_(["Approved", "Processing", "Dispatched", "Delivered"]),
    ]
    if current_user["role"] == "Sales":
        filters.append(SalesInventoryOrder.sales_rep_id == uuid.UUID(current_user["id"]))
    rows = (
        await session.execute(
            select(
                User.id,
                User.username,
                func.count(SalesInventoryOrder.id),
                func.sum(SalesInventoryOrder.total_amount),
            )
            .join(SalesInventoryOrder, SalesInventoryOrder.sales_rep_id == User.id)
            .where(*filters)
            .group_by(User.id, User.username)
            .order_by(func.sum(SalesInventoryOrder.total_amount).desc())
        )
    ).all()
    return [
        {
            "sales_rep_id": str(row[0]),
            "sales_rep_name": row[1],
            "order_count": row[2],
            "sales_total": str(row[3] or ZERO),
        }
        for row in rows
    ]


@router.get("/reports/monthly-sales")
async def monthly_sales_report(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user)
    filters = [
        SalesInventoryOrder.company_id == company_id,
        SalesInventoryOrder.status.in_(["Approved", "Processing", "Dispatched", "Delivered"]),
    ]
    if current_user["role"] == "Sales":
        filters.append(SalesInventoryOrder.sales_rep_id == uuid.UUID(current_user["id"]))
    rows = (
        await session.execute(
            select(
                SalesInventoryOrder.created_at,
                SalesInventoryOrder.total_amount,
            )
            .where(*filters)
            .order_by(SalesInventoryOrder.created_at)
        )
    ).all()
    months: dict[str, dict[str, Decimal | int]] = {}
    for created_at, total in rows:
        month = created_at.strftime("%Y-%m")
        monthly = months.setdefault(month, {"order_count": 0, "sales_total": ZERO})
        monthly["order_count"] += 1
        monthly["sales_total"] += total
    return [
        {
            "month": month,
            "order_count": values["order_count"],
            "sales_total": str(values["sales_total"]),
        }
        for month, values in sorted(months.items())
    ]


@router.get("/reports/pending-orders")
async def pending_orders_report(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user, admin_only=True)
    rows = (
        await session.execute(
            select(SalesInventoryOrder, SalesInventoryDealer.name, User.username)
            .join(SalesInventoryDealer, SalesInventoryDealer.id == SalesInventoryOrder.dealer_id)
            .join(User, User.id == SalesInventoryOrder.sales_rep_id)
            .where(
                SalesInventoryOrder.company_id == company_id,
                SalesInventoryOrder.status == "Pending Approval",
            )
            .order_by(SalesInventoryOrder.created_at)
        )
    ).all()
    return [
        {
            "order_id": str(order.id),
            "order_number": order.order_number,
            "dealer_name": dealer_name,
            "sales_rep_name": rep_name,
            "created_at": order.created_at.isoformat(),
            "total_amount": str(order.total_amount),
        }
        for order, dealer_name, rep_name in rows
    ]


@router.get("/reports/inventory-movement")
async def inventory_movement_report(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user, admin_only=True)
    rows = (
        await session.execute(
            select(
                SalesInventoryProduct.id,
                SalesInventoryProduct.product_code,
                SalesInventoryProduct.name,
                SalesInventoryProduct.unit,
                SalesInventoryTransaction.transaction_type,
                func.count(SalesInventoryTransaction.id),
                func.coalesce(func.sum(SalesInventoryTransaction.quantity_delta), ZERO),
            )
            .join(
                SalesInventoryTransaction,
                SalesInventoryTransaction.product_id == SalesInventoryProduct.id,
            )
            .where(SalesInventoryTransaction.company_id == company_id)
            .group_by(
                SalesInventoryProduct.id,
                SalesInventoryProduct.product_code,
                SalesInventoryProduct.name,
                SalesInventoryProduct.unit,
                SalesInventoryTransaction.transaction_type,
            )
            .order_by(SalesInventoryProduct.name, SalesInventoryTransaction.transaction_type)
        )
    ).all()
    return [
        {
            "product_id": str(row[0]),
            "product_code": row[1],
            "product_name": row[2],
            "unit": row[3],
            "transaction_type": row[4],
            "transaction_count": row[5],
            "net_quantity": str(row[6]),
        }
        for row in rows
    ]


@router.get("/reports/low-stock")
async def low_stock_report(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user)
    rows = (
        await session.execute(
            select(SalesInventoryProduct, SalesInventoryStock.quantity)
            .outerjoin(
                SalesInventoryStock,
                (SalesInventoryStock.product_id == SalesInventoryProduct.id)
                & (SalesInventoryStock.company_id == company_id),
            )
            .where(
                SalesInventoryProduct.company_id == company_id,
                SalesInventoryProduct.is_active.is_(True),
            )
            .order_by(SalesInventoryProduct.name)
        )
    ).all()
    return [
        {
            "product_id": str(product.id),
            "product_code": product.product_code,
            "product_name": product.name,
            "quantity": str(quantity if quantity is not None else ZERO),
            "reorder_level": str(product.reorder_level),
            "unit": product.unit,
        }
        for product, quantity in rows
        if (quantity if quantity is not None else ZERO) <= product.reorder_level
    ]


@router.get("/reports/{report_name}.csv")
async def export_report_csv(
    report_name: Literal[
        "product-sales",
        "dealer-sales",
        "rep-performance",
        "monthly-sales",
        "pending-orders",
        "inventory-movement",
        "low-stock",
    ],
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    report_functions = {
        "product-sales": sales_report,
        "dealer-sales": dealer_sales_report,
        "rep-performance": rep_performance_report,
        "monthly-sales": monthly_sales_report,
        "pending-orders": pending_orders_report,
        "inventory-movement": inventory_movement_report,
        "low-stock": low_stock_report,
    }
    report = await report_functions[report_name](current_user=current_user, session=session)
    rows = report["product_sales"] if report_name == "product-sales" else report
    output = StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=list(rows[0]))
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    key: f"'{value}" if isinstance(value, str) and value.startswith(("=", "+", "-", "@")) else value
                    for key, value in row.items()
                }
            )
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{report_name}.csv"'},
    )


@router.get("/invoices")
async def list_invoices(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user)
    statement = (
        select(SalesInventoryInvoice, SalesInventoryOrder)
        .join(SalesInventoryOrder, SalesInventoryOrder.id == SalesInventoryInvoice.order_id)
        .where(SalesInventoryInvoice.company_id == company_id)
    )
    if current_user["role"] == "Sales":
        statement = statement.where(
            SalesInventoryOrder.sales_rep_id == uuid.UUID(current_user["id"])
        )
    rows = (await session.execute(statement.order_by(SalesInventoryInvoice.created_at.desc()))).all()
    return [
        {
            "id": str(invoice.id),
            "order_id": str(order.id),
            "order_number": order.order_number,
            "invoice_number": invoice.invoice_number,
            "total_amount": str(invoice.total_amount),
            "issued_at": invoice.created_at.isoformat(),
        }
        for invoice, order in rows
    ]


@router.get("/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: uuid.UUID,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    company_id = _tenant_id(current_user)
    row = (
        await session.execute(
            select(SalesInventoryInvoice, SalesInventoryOrder)
            .join(SalesInventoryOrder, SalesInventoryOrder.id == SalesInventoryInvoice.order_id)
            .where(
                SalesInventoryInvoice.id == invoice_id,
                SalesInventoryInvoice.company_id == company_id,
            )
        )
    ).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    invoice, order = row
    if current_user["role"] == "Sales" and order.sales_rep_id != uuid.UUID(current_user["id"]):
        raise HTTPException(status_code=404, detail="Invoice not found.")
    company = await session.get(Company, company_id)
    dealer = await session.get(SalesInventoryDealer, order.dealer_id)
    items = (
        await session.execute(
            select(SalesInventoryOrderItem).where(SalesInventoryOrderItem.order_id == order.id)
        )
    ).scalars().all()
    pdf = generate_pdf_from_data(
        {
            "quotation": {
                "reference_number": invoice.invoice_number,
                "title": "billing",
                "issued_at": invoice.created_at.isoformat(),
                "total_amount": str(invoice.total_amount),
                "subtotal": str(invoice.total_amount),
                "discount": "0.00",
                "tax_amount": "0.00",
                "shipping_amount": "0.00",
            },
            "company": {
                "name": company.name if company else "",
                "address": company.address if company else "",
                "email": company.email if company else "",
                "phone_number": company.phone_number if company else "",
                "website": company.website if company else "",
                "gstin": company.gstin if company else "",
            },
            "customer": {
                "name": dealer.name if dealer else "",
                "company_name": dealer.name if dealer else "",
                "address": dealer.address if dealer else "",
                "email": dealer.email if dealer else "",
                "phone_number": dealer.phone_number if dealer else "",
                "gstin": dealer.gstin if dealer else "",
            },
            "items": [
                {
                    "product_name": item.product_name,
                    "quantity": str(item.quantity),
                    "unit_price": str(item.unit_price),
                    "total_price": str(item.line_total),
                }
                for item in items
            ],
        }
    )
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{invoice.invoice_number}.pdf"'
        },
    )


@router.get("/reports/sales.csv")
async def export_sales_report(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    report = await sales_report(current_user=current_user, session=session)
    rows = ["Product,Quantity,Sales total"]
    for item in report["product_sales"]:
        name = '"' + item["product_name"].replace('"', '""') + '"'
        rows.append(f'{name},{item["quantity"]},{item["sales_total"]}')
    return Response(
        content="\n".join(rows),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="sales-report.csv"'},
    )


@router.get("/notifications")
async def list_notifications(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    company_id = _tenant_id(current_user)
    notifications = (
        await session.execute(
            select(SalesInventoryNotification)
            .where(
                SalesInventoryNotification.company_id == company_id,
                SalesInventoryNotification.user_id == uuid.UUID(current_user["id"]),
            )
            .order_by(SalesInventoryNotification.created_at.desc())
            .limit(100)
        )
    ).scalars().all()
    return [
        {
            "id": str(item.id),
            "event_type": item.event_type,
            "message": item.message,
            "resource_id": str(item.resource_id) if item.resource_id else None,
            "is_read": item.is_read,
            "created_at": item.created_at.isoformat(),
        }
        for item in notifications
    ]


@router.post("/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    company_id = _tenant_id(current_user)
    notification = (
        await session.execute(
            select(SalesInventoryNotification).where(
                SalesInventoryNotification.id == notification_id,
                SalesInventoryNotification.company_id == company_id,
                SalesInventoryNotification.user_id == uuid.UUID(current_user["id"]),
            )
        )
    ).scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notification.is_read = True
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
