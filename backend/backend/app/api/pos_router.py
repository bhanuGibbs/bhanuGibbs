from __future__ import annotations

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from app.schemas.pos_product import (
    POSCategoryCreate,
    POSCategoryRead,
    POSCategoryUpdate,
    POSCheckoutRequest,
    POSProductCreate,
    POSProductRead,
    POSProductUpdate,
    POSReturnRead,
    POSReturnRequest,
    POSStockAdjustment,
    POSTransactionRead,
    POSVariantCreate,
    POSVariantRead,
)
from app.services.pos_category_service import POSCategoryService
from app.services.pos_product_service import POSProductService
from app.services.pos_transaction_service import POSTransactionService
from app.services.pos_inventory_service import POSInventoryService
from app.services.pos_dashboard_service import POSDashboardService
from app.services.exceptions import ConflictError, NotFoundError, BadRequestError

router = APIRouter(prefix="/pos", tags=["POS"])


def _check_admin_role(current_user: dict[str, str]) -> None:
    """Check if user has Admin or Super Admin role."""
    if current_user["role"] not in {"Admin", "Super Admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges.")


# ---- Categories ----

@router.post("/categories", response_model=POSCategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: POSCategoryCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSCategoryService(session)
    category = await service.create_category(
        company_id=current_user["company_id"],
        name=payload.name,
        description=payload.description,
    )
    await service.save()
    return POSCategoryRead.model_validate({
        "id": str(category.id),
        "company_id": str(category.company_id),
        "name": category.name,
        "description": category.description,
        "is_active": category.is_active,
        "created_at": category.created_at,
        "updated_at": category.updated_at,
    })


@router.get("/categories", response_model=list[POSCategoryRead])
async def list_categories(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSCategoryService(session)
    categories = await service.list_categories(current_user["company_id"])
    return [POSCategoryRead.model_validate({
        "id": str(c.id), "company_id": str(c.company_id), "name": c.name,
        "description": c.description, "is_active": c.is_active,
        "created_at": c.created_at, "updated_at": c.updated_at,
    }) for c in categories]


@router.get("/categories/{category_id}", response_model=POSCategoryRead)
async def get_category(
    category_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSCategoryService(session)
    category = await service.get_category(category_id, current_user["company_id"])
    return POSCategoryRead.model_validate({
        "id": str(category.id), "company_id": str(category.company_id), "name": category.name,
        "description": category.description, "is_active": category.is_active,
        "created_at": category.created_at, "updated_at": category.updated_at,
    })


@router.put("/categories/{category_id}", response_model=POSCategoryRead)
async def update_category(
    category_id: str,
    payload: POSCategoryUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSCategoryService(session)
    category = await service.update_category(
        category_id, current_user["company_id"],
        name=payload.name, description=payload.description, is_active=payload.is_active,
    )
    await service.save()
    return POSCategoryRead.model_validate({
        "id": str(category.id), "company_id": str(category.company_id), "name": category.name,
        "description": category.description, "is_active": category.is_active,
        "created_at": category.created_at, "updated_at": category.updated_at,
    })


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSCategoryService(session)
    await service.delete_category(category_id, current_user["company_id"])


# ---- Products ----

@router.post("/products", response_model=POSProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: POSProductCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSProductService(session)
    try:
        product = await service.create_product(
            company_id=current_user["company_id"],
            name=payload.name, sku=payload.sku, barcode=payload.barcode,
            selling_price=payload.selling_price, unit=payload.unit,
            category_id=payload.category_id, description=payload.description,
            purchase_price=payload.purchase_price, stock_quantity=payload.stock_quantity,
            low_stock_threshold=payload.low_stock_threshold, created_by_id=current_user["id"],
        )
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    await service.save()
    return POSProductRead.model_validate({
        "id": str(product.id), "company_id": str(product.company_id),
        "category_id": str(product.category_id) if product.category_id else None,
        "name": product.name, "sku": product.sku, "barcode": product.barcode,
        "description": product.description, "purchase_price": product.purchase_price,
        "selling_price": product.selling_price, "unit": product.unit,
        "stock_quantity": product.stock_quantity, "low_stock_threshold": product.low_stock_threshold,
        "image_path": product.image_path, "is_active": product.is_active,
        "created_by_id": str(product.created_by_id) if product.created_by_id else None,
        "created_at": product.created_at, "updated_at": product.updated_at,
    })


@router.get("/products", response_model=list[POSProductRead])
async def list_products(
    category_id: str | None = Query(None),
    search: str | None = Query(None),
    active_only: bool = Query(True),
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSProductService(session)
    products = await service.list_products(current_user["company_id"], category_id, search, active_only)
    return [POSProductRead.model_validate({
        "id": str(p.id), "company_id": str(p.company_id),
        "category_id": str(p.category_id) if p.category_id else None,
        "name": p.name, "sku": p.sku, "barcode": p.barcode,
        "description": p.description, "purchase_price": p.purchase_price,
        "selling_price": p.selling_price, "unit": p.unit,
        "stock_quantity": p.stock_quantity, "low_stock_threshold": p.low_stock_threshold,
        "image_path": p.image_path, "is_active": p.is_active,
        "created_by_id": str(p.created_by_id) if p.created_by_id else None,
        "created_at": p.created_at, "updated_at": p.updated_at,
    }) for p in products]


@router.get("/products/barcode/{barcode}", response_model=POSProductRead)
async def lookup_by_barcode(
    barcode: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSProductService(session)
    product = await service.get_by_barcode(current_user["company_id"], barcode)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return POSProductRead.model_validate({
        "id": str(product.id), "company_id": str(product.company_id),
        "category_id": str(product.category_id) if product.category_id else None,
        "name": product.name, "sku": product.sku, "barcode": product.barcode,
        "description": product.description, "purchase_price": product.purchase_price,
        "selling_price": product.selling_price, "unit": product.unit,
        "stock_quantity": product.stock_quantity, "low_stock_threshold": product.low_stock_threshold,
        "image_path": product.image_path, "is_active": product.is_active,
        "created_by_id": str(product.created_by_id) if product.created_by_id else None,
        "created_at": product.created_at, "updated_at": product.updated_at,
    })


@router.get("/products/{product_id}", response_model=POSProductRead)
async def get_product(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSProductService(session)
    try:
        product = await service.get_product(product_id, current_user["company_id"])
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return POSProductRead.model_validate({
        "id": str(product.id), "company_id": str(product.company_id),
        "category_id": str(product.category_id) if product.category_id else None,
        "name": product.name, "sku": product.sku, "barcode": product.barcode,
        "description": product.description, "purchase_price": product.purchase_price,
        "selling_price": product.selling_price, "unit": product.unit,
        "stock_quantity": product.stock_quantity, "low_stock_threshold": product.low_stock_threshold,
        "image_path": product.image_path, "is_active": product.is_active,
        "created_by_id": str(product.created_by_id) if product.created_by_id else None,
        "created_at": product.created_at, "updated_at": product.updated_at,
    })


@router.put("/products/{product_id}", response_model=POSProductRead)
async def update_product(
    product_id: str,
    payload: POSProductUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSProductService(session)
    try:
        product = await service.update_product(
            product_id, current_user["company_id"],
            name=payload.name, sku=payload.sku, barcode=payload.barcode,
            selling_price=payload.selling_price, unit=payload.unit,
            category_id=payload.category_id, description=payload.description,
            purchase_price=payload.purchase_price, stock_quantity=payload.stock_quantity,
            low_stock_threshold=payload.low_stock_threshold, is_active=payload.is_active,
        )
    except (NotFoundError, ConflictError) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_409_CONFLICT
        raise HTTPException(status_code=status_code, detail=str(e))
    await service.save()
    return POSProductRead.model_validate({
        "id": str(product.id), "company_id": str(product.company_id),
        "category_id": str(product.category_id) if product.category_id else None,
        "name": product.name, "sku": product.sku, "barcode": product.barcode,
        "description": product.description, "purchase_price": product.purchase_price,
        "selling_price": product.selling_price, "unit": product.unit,
        "stock_quantity": product.stock_quantity, "low_stock_threshold": product.low_stock_threshold,
        "image_path": product.image_path, "is_active": product.is_active,
        "created_by_id": str(product.created_by_id) if product.created_by_id else None,
        "created_at": product.created_at, "updated_at": product.updated_at,
    })


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSProductService(session)
    try:
        await service.delete_product(product_id, current_user["company_id"])
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")


@router.post("/products/{product_id}/generate-barcode")
async def generate_barcode(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSProductService(session)
    try:
        barcode = await service.generate_barcode(product_id, current_user["company_id"])
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return {"barcode": barcode}


# ---- Variants ----

@router.post("/products/{product_id}/variants", response_model=POSVariantRead, status_code=status.HTTP_201_CREATED)
async def create_variant(
    product_id: str,
    payload: POSVariantCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSProductService(session)
    try:
        variant = await service.create_variant(
            product_id, current_user["company_id"],
            name=payload.name, selling_price=payload.selling_price,
            stock_quantity=payload.stock_quantity, low_stock_threshold=payload.low_stock_threshold,
            sku=payload.sku, barcode=payload.barcode,
        )
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    await service.save()
    return POSVariantRead.model_validate({
        "id": str(variant.id), "product_id": str(variant.product_id),
        "company_id": str(variant.company_id), "name": variant.name,
        "sku": variant.sku, "barcode": variant.barcode, "selling_price": variant.selling_price,
        "stock_quantity": variant.stock_quantity, "low_stock_threshold": variant.low_stock_threshold,
        "is_active": variant.is_active, "created_at": variant.created_at, "updated_at": variant.updated_at,
    })


@router.get("/products/{product_id}/variants", response_model=list[POSVariantRead])
async def list_variants(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSProductService(session)
    try:
        variants = await service.get_variants(product_id, current_user["company_id"])
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return [POSVariantRead.model_validate({
        "id": str(v.id), "product_id": str(v.product_id), "company_id": str(v.company_id),
        "name": v.name, "sku": v.sku, "barcode": v.barcode, "selling_price": v.selling_price,
        "stock_quantity": v.stock_quantity, "low_stock_threshold": v.low_stock_threshold,
        "is_active": v.is_active, "created_at": v.created_at, "updated_at": v.updated_at,
    }) for v in variants]


@router.put("/variants/{variant_id}", response_model=POSVariantRead)
async def update_variant(
    variant_id: str,
    product_id: str = Query(...),
    payload: POSVariantCreate = ...,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSProductService(session)
    try:
        variant = await service.update_variant(
            variant_id, product_id, current_user["company_id"],
            name=payload.name, selling_price=payload.selling_price,
            stock_quantity=payload.stock_quantity, low_stock_threshold=payload.low_stock_threshold,
        )
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found.")
    await service.save()
    return POSVariantRead.model_validate({
        "id": str(variant.id), "product_id": str(variant.product_id),
        "company_id": str(variant.company_id), "name": variant.name,
        "sku": variant.sku, "barcode": variant.barcode, "selling_price": variant.selling_price,
        "stock_quantity": variant.stock_quantity, "low_stock_threshold": variant.low_stock_threshold,
        "is_active": variant.is_active, "created_at": variant.created_at, "updated_at": variant.updated_at,
    })


@router.delete("/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_variant(
    variant_id: str,
    product_id: str = Query(...),
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSProductService(session)
    try:
        await service.delete_variant(variant_id, product_id, current_user["company_id"])
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found.")


# ---- Transactions ----

@router.post("/transactions", response_model=POSTransactionRead, status_code=status.HTTP_201_CREATED)
async def checkout(
    payload: POSCheckoutRequest,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSTransactionService(session)
    try:
        items = [item.model_dump() for item in payload.items]
        transaction = await service.checkout(
            company_id=current_user["company_id"],
            created_by_id=current_user["id"],
            items=items,
            payment_method=payload.payment_method,
            payment_amount=payload.payment_amount,
            discount=payload.discount,
            notes=payload.notes,
        )
    except BadRequestError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    items_data = await service.transaction_repo.get_items(transaction.id)
    return POSTransactionRead.model_validate({
        "id": str(transaction.id), "company_id": str(transaction.company_id),
        "transaction_number": transaction.transaction_number,
        "created_by_id": str(transaction.created_by_id) if transaction.created_by_id else None,
        "subtotal": transaction.subtotal, "discount": transaction.discount,
        "tax_amount": transaction.tax_amount, "grand_total": transaction.grand_total,
        "payment_method": transaction.payment_method, "payment_amount": transaction.payment_amount,
        "status": transaction.status, "notes": transaction.notes, "created_at": transaction.created_at,
        "items": [{
            "id": str(i.id), "product_name": i.product_name, "sku": i.sku,
            "barcode": i.barcode, "quantity": i.quantity, "unit_price": i.unit_price,
            "discount": i.discount, "tax_amount": i.tax_amount, "line_total": i.line_total,
        } for i in items_data],
    })


@router.get("/transactions", response_model=list[POSTransactionRead])
async def list_transactions(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSTransactionService(session)
    transactions = await service.list_transactions(
        current_user["company_id"], start_date, end_date, status_filter
    )
    result = []
    for t in transactions:
        items = await service.transaction_repo.get_items(t.id)
        result.append(POSTransactionRead.model_validate({
            "id": str(t.id), "company_id": str(t.company_id),
            "transaction_number": t.transaction_number,
            "created_by_id": str(t.created_by_id) if t.created_by_id else None,
            "subtotal": t.subtotal, "discount": t.discount,
            "tax_amount": t.tax_amount, "grand_total": t.grand_total,
            "payment_method": t.payment_method, "payment_amount": t.payment_amount,
            "status": t.status, "notes": t.notes, "created_at": t.created_at,
            "items": [{
                "id": str(i.id), "product_name": i.product_name, "sku": i.sku,
                "barcode": i.barcode, "quantity": i.quantity, "unit_price": i.unit_price,
                "discount": i.discount, "tax_amount": i.tax_amount, "line_total": i.line_total,
            } for i in items],
        }))
    return result


@router.get("/transactions/{transaction_id}", response_model=POSTransactionRead)
async def get_transaction(
    transaction_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSTransactionService(session)
    try:
        transaction = await service.get_transaction(transaction_id, current_user["company_id"])
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
    items = await service.transaction_repo.get_items(transaction.id)
    return POSTransactionRead.model_validate({
        "id": str(transaction.id), "company_id": str(transaction.company_id),
        "transaction_number": transaction.transaction_number,
        "created_by_id": str(transaction.created_by_id) if transaction.created_by_id else None,
        "subtotal": transaction.subtotal, "discount": transaction.discount,
        "tax_amount": transaction.tax_amount, "grand_total": transaction.grand_total,
        "payment_method": transaction.payment_method, "payment_amount": transaction.payment_amount,
        "status": transaction.status, "notes": transaction.notes, "created_at": transaction.created_at,
        "items": [{
            "id": str(i.id), "product_name": i.product_name, "sku": i.sku,
            "barcode": i.barcode, "quantity": i.quantity, "unit_price": i.unit_price,
            "discount": i.discount, "tax_amount": i.tax_amount, "line_total": i.line_total,
        } for i in items],
    })


@router.post("/transactions/{transaction_id}/cancel", response_model=POSTransactionRead)
async def cancel_transaction(
    transaction_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSTransactionService(session)
    try:
        transaction = await service.cancel_transaction(
            transaction_id, current_user["company_id"], current_user["id"]
        )
    except (NotFoundError, BadRequestError) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(e))
    items = await service.transaction_repo.get_items(transaction.id)
    return POSTransactionRead.model_validate({
        "id": str(transaction.id), "company_id": str(transaction.company_id),
        "transaction_number": transaction.transaction_number,
        "created_by_id": str(transaction.created_by_id) if transaction.created_by_id else None,
        "subtotal": transaction.subtotal, "discount": transaction.discount,
        "tax_amount": transaction.tax_amount, "grand_total": transaction.grand_total,
        "payment_method": transaction.payment_method, "payment_amount": transaction.payment_amount,
        "status": transaction.status, "notes": transaction.notes, "created_at": transaction.created_at,
        "items": [{
            "id": str(i.id), "product_name": i.product_name, "sku": i.sku,
            "barcode": i.barcode, "quantity": i.quantity, "unit_price": i.unit_price,
            "discount": i.discount, "tax_amount": i.tax_amount, "line_total": i.line_total,
        } for i in items],
    })


# ---- Returns ----

@router.post("/returns", response_model=POSReturnRead, status_code=status.HTTP_201_CREATED)
async def create_return(
    payload: POSReturnRequest,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSTransactionService(session)
    try:
        items = [item.model_dump() for item in payload.items]
        ret = await service.create_return(
            company_id=current_user["company_id"],
            transaction_id=payload.transaction_id,
            created_by_id=current_user["id"],
            items=items,
            refund_method=payload.refund_method,
            reason=payload.reason,
        )
    except (NotFoundError, BadRequestError) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(e))
    return POSReturnRead.model_validate({
        "id": str(ret.id), "company_id": str(ret.company_id),
        "transaction_id": str(ret.transaction_id), "reason": ret.reason,
        "refund_amount": ret.refund_amount, "refund_method": ret.refund_method,
        "created_by_id": str(ret.created_by_id) if ret.created_by_id else None,
        "created_at": ret.created_at,
    })


@router.get("/returns", response_model=list[POSReturnRead])
async def list_returns(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSTransactionService(session)
    returns = await service.transaction_repo.list_returns_by_company(current_user["company_id"])
    return [POSReturnRead.model_validate({
        "id": str(r.id), "company_id": str(r.company_id),
        "transaction_id": str(r.transaction_id), "reason": r.reason,
        "refund_amount": r.refund_amount, "refund_method": r.refund_method,
        "created_by_id": str(r.created_by_id) if r.created_by_id else None,
        "created_at": r.created_at,
    }) for r in returns]


# ---- Inventory ----

@router.get("/inventory")
async def get_inventory(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSInventoryService(session)
    return await service.get_inventory_summary(current_user["company_id"])


@router.get("/inventory/low-stock", response_model=list[POSProductRead])
async def get_low_stock(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSInventoryService(session)
    products = await service.get_low_stock_products(current_user["company_id"])
    return [POSProductRead.model_validate({
        "id": str(p.id), "company_id": str(p.company_id),
        "category_id": str(p.category_id) if p.category_id else None,
        "name": p.name, "sku": p.sku, "barcode": p.barcode,
        "description": p.description, "purchase_price": p.purchase_price,
        "selling_price": p.selling_price, "unit": p.unit,
        "stock_quantity": p.stock_quantity, "low_stock_threshold": p.low_stock_threshold,
        "image_path": p.image_path, "is_active": p.is_active,
        "created_by_id": str(p.created_by_id) if p.created_by_id else None,
        "created_at": p.created_at, "updated_at": p.updated_at,
    }) for p in products]


@router.post("/inventory/adjust", response_model=POSProductRead)
async def adjust_stock(
    payload: POSStockAdjustment,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSInventoryService(session)
    try:
        product = await service.adjust_stock(
            current_user["company_id"], payload.product_id, payload.quantity,
            current_user["id"], payload.notes,
        )
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return POSProductRead.model_validate({
        "id": str(product.id), "company_id": str(product.company_id),
        "category_id": str(product.category_id) if product.category_id else None,
        "name": product.name, "sku": product.sku, "barcode": product.barcode,
        "description": product.description, "purchase_price": product.purchase_price,
        "selling_price": product.selling_price, "unit": product.unit,
        "stock_quantity": product.stock_quantity, "low_stock_threshold": product.low_stock_threshold,
        "image_path": product.image_path, "is_active": product.is_active,
        "created_by_id": str(product.created_by_id) if product.created_by_id else None,
        "created_at": product.created_at, "updated_at": product.updated_at,
    })


@router.get("/stock-movements")
async def get_stock_movements(
    product_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSInventoryService(session)
    movements = await service.get_stock_movements(current_user["company_id"], product_id, limit)
    return [{
        "id": str(m.id), "product_id": str(m.product_id) if m.product_id else None,
        "variant_id": str(m.variant_id) if m.variant_id else None,
        "movement_type": m.movement_type, "quantity": m.quantity,
        "reference_type": m.reference_type, "reference_id": m.reference_id,
        "notes": m.notes, "created_at": m.created_at,
    } for m in movements]


# ---- Dashboard ----

@router.get("/dashboard")
async def get_dashboard(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSDashboardService(session)
    return await service.get_dashboard_data(current_user["company_id"])
