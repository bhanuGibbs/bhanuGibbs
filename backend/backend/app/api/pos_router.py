from __future__ import annotations

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session, require_business_profile
from app.models.user import User
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
    UnifiedProductRead,
)
from app.schemas.tenant_product import (
    TenantProductCreate,
    TenantProductListResult,
    TenantProductRead,
    TenantProductUpdate,
)
from app.schemas.master_product import MasterProductSearchResult
from app.services.pos_category_service import POSCategoryService
from app.services.pos_product_service import POSProductService
from app.services.pos_transaction_service import POSTransactionService
from app.services.pos_inventory_service import POSInventoryService
from app.services.pos_dashboard_service import POSDashboardService
from app.services.tenant_product_service import TenantProductService
from app.services.master_product_service import MasterProductService
from app.services.exceptions import ConflictError, NotFoundError, BadRequestError

router = APIRouter(
    prefix="/pos",
    tags=["POS"],
    dependencies=[Depends(require_business_profile("invoice", "pos", "delivery_challan"))],
)


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


@router.get("/products", response_model=list[UnifiedProductRead])
async def list_products(
    category_id: str | None = Query(None),
    search: str | None = Query(None),
    active_only: bool = Query(True),
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    company_id = current_user["company_id"]

    # Fetch pos_products
    pos_service = POSProductService(session)
    pos_products = await pos_service.list_products(company_id, category_id, search, active_only)
    unified = []
    for p in pos_products:
        unified.append(UnifiedProductRead(
            id=str(p.id), company_id=str(p.company_id),
            category_id=str(p.category_id) if p.category_id else None,
            name=p.name, sku=p.sku, barcode=p.barcode,
            description=p.description, purchase_price=p.purchase_price,
            selling_price=p.selling_price, unit=p.unit,
            stock_quantity=p.stock_quantity, low_stock_threshold=p.low_stock_threshold,
            image_path=p.image_path, is_active=p.is_active,
            created_by_id=str(p.created_by_id) if p.created_by_id else None,
            created_at=p.created_at, updated_at=p.updated_at,
            source="pos_product",
            master_product_id=None,
        ))

    # Fetch tenant_products (imported from central repository)
    tenant_service = TenantProductService(session)
    tenant_result = await tenant_service.list_products(company_id, skip=0, limit=200)
    for tp in tenant_result.products:
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            name_match = tp.product_name and search_lower in tp.product_name.lower()
            sku_match = tp.sku and search_lower in tp.sku.lower()
            barcode_match = tp.barcode and search_lower in tp.barcode.lower()
            if not (name_match or sku_match or barcode_match):
                continue
        unified.append(UnifiedProductRead(
            id=str(tp.id), company_id=str(tp.company_id),
            category_id=None,
            name=tp.product_name or "",
            sku=tp.sku or "",
            barcode=tp.barcode or "",
            description=tp.description,
            purchase_price=None,
            selling_price=tp.selling_price,
            unit=tp.unit,
            stock_quantity=tp.stock_qty,
            low_stock_threshold=tp.low_stock_threshold,
            image_path=None,
            is_active=True,
            created_by_id=None,
            created_at=tp.created_at,
            updated_at=tp.updated_at,
            source="tenant_product",
            master_product_id=str(tp.master_product_id) if tp.master_product_id else None,
        ))

    return unified


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
        await service.deactivate_product(product_id, current_user["company_id"])
        await service.save()
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

    items_data = await service.transaction_repo.get_items(str(transaction.id))
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
        items = await service.transaction_repo.get_items(str(t.id))
        cashier_name = None
        if t.created_by_id:
            cashier = await session.get(User, t.created_by_id)
            cashier_name = cashier.username if cashier else None
        result.append(POSTransactionRead.model_validate({
            "id": str(t.id), "company_id": str(t.company_id),
            "transaction_number": t.transaction_number,
            "created_by_id": str(t.created_by_id) if t.created_by_id else None,
            "created_by_name": cashier_name,
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
    items = await service.transaction_repo.get_items(str(transaction.id))
    cashier_name = None
    if transaction.created_by_id:
        cashier = await session.get(User, transaction.created_by_id)
        cashier_name = cashier.username if cashier else None
    return POSTransactionRead.model_validate({
        "id": str(transaction.id), "company_id": str(transaction.company_id),
        "transaction_number": transaction.transaction_number,
        "created_by_id": str(transaction.created_by_id) if transaction.created_by_id else None,
        "created_by_name": cashier_name,
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
    items = await service.transaction_repo.get_items(str(transaction.id))
    cashier_name = None
    if transaction.created_by_id:
        cashier = await session.get(User, transaction.created_by_id)
        cashier_name = cashier.username if cashier else None
    return POSTransactionRead.model_validate({
        "id": str(transaction.id), "company_id": str(transaction.company_id),
        "transaction_number": transaction.transaction_number,
        "created_by_id": str(transaction.created_by_id) if transaction.created_by_id else None,
        "created_by_name": cashier_name,
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


# ---- Cashier Performance Report (Admin only) ----

@router.get("/cashier-performance")
async def get_cashier_performance(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    """Per-cashier performance summary for Admin to see all cashiers."""
    _check_admin_role(current_user)
    from decimal import ROUND_HALF_UP, Decimal as DEC

    from sqlalchemy import func, select

    from app.models.pos_transaction import POSTransaction
    from app.models.pos_return import POSReturn

    company_id = current_user["company_id"]

    # Aggregate by cashier (created_by_id)
    cashier_rows = (
        await session.execute(
            select(
                POSTransaction.created_by_id,
                func.count(POSTransaction.id).label("total"),
                func.sum(func.case((POSTransaction.status == "completed", 1), else_=0)).label("completed"),
                func.sum(func.case((POSTransaction.status == "cancelled", 1), else_=0)).label("cancelled"),
                func.coalesce(func.sum(func.case((POSTransaction.status == "completed", POSTransaction.grand_total), else_=DEC("0"))), DEC("0")).label("revenue"),
            )
            .where(
                POSTransaction.company_id == company_id,
            )
            .group_by(POSTransaction.created_by_id)
        )
    ).all()

    result = []
    for cashier_id, total, completed, cancelled, revenue in cashier_rows:
        if cashier_id is None:
            continue
        completed = completed or 0
        cancelled = cancelled or 0
        total = total or (completed + cancelled)

        # Get cashier username
        cashier = await session.get(User, cashier_id)
        cashier_name = cashier.username if cashier else "Unknown"

        # Cancel rate
        cancel_rate = 0.0
        if total > 0:
            cancel_rate = round((cancelled / total) * 100, 1)

        # Returns by this cashier
        return_row = (
            await session.execute(
                select(
                    func.count(POSReturn.id),
                    func.coalesce(func.sum(POSReturn.refund_amount), DEC("0")),
                ).where(
                    POSReturn.company_id == company_id,
                    POSReturn.created_by_id == cashier_id,
                )
            )
        ).one()
        return_count = return_row[0] or 0
        total_refund = return_row[1]

        # Return rate
        return_rate = 0.0
        if completed > 0:
            return_rate = round((return_count / completed) * 100, 1)

        # Avg transaction value
        avg_value = "0"
        if completed > 0:
            avg_value = str((revenue / completed).quantize(DEC("0.01"), rounding=ROUND_HALF_UP))

        result.append({
            "cashier_id": str(cashier_id),
            "cashier_name": cashier_name,
            "completed_count": completed,
            "cancelled_count": cancelled,
            "total_count": total,
            "completed_revenue": str(revenue),
            "avg_transaction_value": avg_value,
            "cancel_rate": cancel_rate,
            "return_count": return_count,
            "total_refund_amount": str(total_refund),
            "return_rate": return_rate,
        })

    # Sort by revenue descending
    result.sort(key=lambda x: float(x["completed_revenue"]), reverse=True)
    return result


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


@router.get("/inventory/low-stock")
async def get_low_stock(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSInventoryService(session)
    products = await service.get_low_stock_products(current_user["company_id"])
    return products


@router.post("/inventory/adjust")
async def adjust_stock(
    payload: POSStockAdjustment,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    _check_admin_role(current_user)
    service = POSInventoryService(session)
    try:
        result = await service.adjust_stock(
            current_user["company_id"], payload.product_id, payload.quantity,
            current_user["id"], payload.notes,
        )
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return result


@router.get("/stock-movements")
async def get_stock_movements(
    product_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Get stock movement history with product names."""
    service = POSInventoryService(session)
    movements = await service.get_stock_movements(current_user["company_id"], product_id, limit)

    # Build a product name lookup for all movements
    product_ids = set()
    for m in movements:
        if m.product_id:
            product_ids.add(m.product_id)

    product_names = {}
    if product_ids:
        from app.models.pos_product import POSProduct
        from app.models.tenant_product import TenantProduct
        from app.models.master_product import MasterProduct
        from sqlalchemy import select

        # Get POS product names
        pos_result = await session.execute(
            select(POSProduct.id, POSProduct.name).where(POSProduct.id.in_(product_ids))
        )
        for row in pos_result.all():
            product_names[str(row[0])] = row[1]

        # Get tenant product names (join with master_products for name)
        tenant_result = await session.execute(
            select(TenantProduct.id, MasterProduct.product_name)
            .outerjoin(MasterProduct, TenantProduct.master_product_id == MasterProduct.id)
            .where(TenantProduct.id.in_(product_ids))
        )
        for row in tenant_result.all():
            product_names[str(row[0])] = row[1] or "Unknown"

    result = []
    for m in movements:
        result.append({
            "id": str(m.id),
            "product_id": str(m.product_id) if m.product_id else None,
            "product_name": product_names.get(str(m.product_id)) if m.product_id else None,
            "variant_id": str(m.variant_id) if m.variant_id else None,
            "movement_type": m.movement_type,
            "quantity": m.quantity,
            "reference_type": m.reference_type,
            "reference_id": m.reference_id,
            "notes": m.notes,
            "created_at": m.created_at,
        })
    return result


# ---- Dashboard ----

@router.get("/dashboard")
async def get_dashboard(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = POSDashboardService(session)
    return await service.get_dashboard_data(current_user["company_id"])


# ---- Cashier Stats ----

@router.get("/cashier-stats")
async def get_cashier_stats(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    """Personal KPI stats for the current POS cashier."""
    from decimal import ROUND_HALF_UP, Decimal as DEC

    from sqlalchemy import func, select

    from app.models.pos_transaction import POSTransaction
    from app.models.pos_return import POSReturn
    from app.models.pos_transaction_item import POSTransactionItem
    from app.models.pos_product import POSProduct

    company_id = current_user["company_id"]
    cashier_id = current_user["id"]

    # Total completed transactions by this cashier
    completed_count_scalar = (
        await session.execute(
            select(func.count(POSTransaction.id)).where(
                POSTransaction.company_id == company_id,
                POSTransaction.created_by_id == cashier_id,
                POSTransaction.status == "completed",
            )
        )
    ).scalar_one()
    completed_count = completed_count_scalar or 0

    # Total revenue from completed transactions
    completed_revenue_scalar = (
        await session.execute(
            select(func.coalesce(func.sum(POSTransaction.grand_total), DEC("0"))).where(
                POSTransaction.company_id == company_id,
                POSTransaction.created_by_id == cashier_id,
                POSTransaction.status == "completed",
            )
        )
    ).scalar_one()
    completed_revenue = completed_revenue_scalar

    # Cancelled transactions
    cancelled_count_scalar = (
        await session.execute(
            select(func.count(POSTransaction.id)).where(
                POSTransaction.company_id == company_id,
                POSTransaction.created_by_id == cashier_id,
                POSTransaction.status == "cancelled",
            )
        )
    ).scalar_one()
    cancelled_count = cancelled_count_scalar or 0

    # Total transactions (completed + cancelled)
    total_count = completed_count + cancelled_count

    # Average transaction value (completed only)
    avg_transaction_value = "0"
    if completed_count > 0:
        avg_transaction_value = str((completed_revenue / completed_count).quantize(DEC("0.01"), rounding=ROUND_HALF_UP))

    # Cancel rate
    cancel_rate = 0.0
    if total_count > 0:
        cancel_rate = round((cancelled_count / total_count) * 100, 1)

    # Returns initiated by this cashier
    return_count_scalar = (
        await session.execute(
            select(func.count(POSReturn.id)).where(
                POSReturn.company_id == company_id,
                POSReturn.created_by_id == cashier_id,
            )
        )
    ).scalar_one()
    return_count = return_count_scalar or 0

    total_refund_amount_scalar = (
        await session.execute(
            select(func.coalesce(func.sum(POSReturn.refund_amount), DEC("0"))).where(
                POSReturn.company_id == company_id,
                POSReturn.created_by_id == cashier_id,
            )
        )
    ).scalar_one()
    total_refund_amount = total_refund_amount_scalar

    # Return rate (returns / completed transactions)
    return_rate = 0.0
    if completed_count > 0:
        return_rate = round((return_count / completed_count) * 100, 1)

    # Payment method breakdown
    payment_rows = (
        await session.execute(
            select(
                POSTransaction.payment_method,
                func.count(POSTransaction.id),
                func.coalesce(func.sum(POSTransaction.grand_total), DEC("0")),
            )
            .where(
                POSTransaction.company_id == company_id,
                POSTransaction.created_by_id == cashier_id,
                POSTransaction.status == "completed",
            )
            .group_by(POSTransaction.payment_method)
            .order_by(func.count(POSTransaction.id).desc())
        )
    ).all()
    payment_breakdown = [
        {
            "method": row[0],
            "count": row[1],
            "total": str(row[2]),
        }
        for row in payment_rows
    ]

    # Top products sold by this cashier
    top_product_rows = (
        await session.execute(
            select(
                POSTransactionItem.product_id,
                func.count(POSTransactionItem.id).label("item_count"),
                func.coalesce(func.sum(POSTransactionItem.quantity), DEC("0")).label("total_qty"),
                func.coalesce(func.sum(POSTransactionItem.line_total), DEC("0")).label("total_value"),
            )
            .join(
                POSTransaction,
                POSTransaction.id == POSTransactionItem.transaction_id,
            )
            .where(
                POSTransaction.company_id == company_id,
                POSTransaction.created_by_id == cashier_id,
                POSTransaction.status == "completed",
            )
            .group_by(POSTransactionItem.product_id)
            .order_by(func.sum(POSTransactionItem.line_total).desc())
            .limit(5)
        )
    ).all()

    top_products = []
    for product_id, item_count, total_qty, total_value in top_product_rows:
        product = await session.get(POSProduct, product_id)
        if product:
            top_products.append({
                "product_id": str(product_id),
                "product_name": product.name,
                "item_count": item_count,
                "total_quantity": int(total_qty),
                "total_value": str(total_value),
            })

    # Today's transactions (PostgreSQL: use DATE() cast and CURRENT_DATE)
    today_count_scalar = (
        await session.execute(
            select(func.count(POSTransaction.id)).where(
                POSTransaction.company_id == company_id,
                POSTransaction.created_by_id == cashier_id,
                POSTransaction.status == "completed",
                func.date(POSTransaction.created_at) == func.current_date(),
            )
        )
    ).scalar_one()
    today_count = today_count_scalar or 0

    today_revenue_scalar = (
        await session.execute(
            select(func.coalesce(func.sum(POSTransaction.grand_total), DEC("0"))).where(
                POSTransaction.company_id == company_id,
                POSTransaction.created_by_id == cashier_id,
                POSTransaction.status == "completed",
                func.date(POSTransaction.created_at) == func.current_date(),
            )
        )
    ).scalar_one()
    today_revenue = today_revenue_scalar

    # Monthly sales (last 6 months) — PostgreSQL: use TO_CHAR instead of strftime
    monthly_rows = (
        await session.execute(
            select(
                func.to_char(POSTransaction.created_at, 'YYYY-MM').label("month"),
                func.count(POSTransaction.id),
                func.coalesce(func.sum(POSTransaction.grand_total), DEC("0")),
            )
            .where(
                POSTransaction.company_id == company_id,
                POSTransaction.created_by_id == cashier_id,
                POSTransaction.status == "completed",
            )
            .group_by(func.to_char(POSTransaction.created_at, 'YYYY-MM'))
            .order_by(func.to_char(POSTransaction.created_at, 'YYYY-MM'))
        )
    ).all()
    monthly_sales = [
        {
            "month": row[0],
            "transaction_count": row[1],
            "sales_total": str(row[2]),
        }
        for row in monthly_rows
    ][-6:]

    return {
        "completed_count": completed_count,
        "completed_revenue": str(completed_revenue),
        "cancelled_count": cancelled_count,
        "total_count": total_count,
        "avg_transaction_value": avg_transaction_value,
        "cancel_rate": cancel_rate,
        "return_count": return_count,
        "total_refund_amount": str(total_refund_amount),
        "return_rate": return_rate,
        "payment_breakdown": payment_breakdown,
        "top_products": top_products,
        "today_count": today_count,
        "today_revenue": str(today_revenue),
        "monthly_sales": monthly_sales,
    }


# ---- Tenant Products (Central Product Repository) ----


@router.get("/master-search", response_model=MasterProductSearchResult)
async def search_master_products_for_import(
    q: str | None = Query(default=None, description="Search query"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Search master products for importing into tenant.

    Results are filtered by the user's company business type.
    """
    service = MasterProductService(session)
    business_type = current_user.get("company_business_type")

    result = await service.search_products(
        query=q,
        business_type=business_type,
        active_only=True,
        skip=skip,
        limit=limit,
    )
    return result


@router.post("/tenant-products", response_model=TenantProductRead, status_code=status.HTTP_201_CREATED)
async def create_tenant_product(
    payload: TenantProductCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Import a master product as a tenant product.

    Admin and Super Admin can import products.
    """
    if current_user["role"] not in {"Admin", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    service = TenantProductService(session)
    try:
        product = await service.import_from_master(
            company_id=current_user["company_id"],
            data=payload,
        )
        await service.repository.commit()
    except (NotFoundError, ConflictError) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_409_CONFLICT
        raise HTTPException(status_code=status_code, detail=str(e))

    # Return enriched product
    enriched = await service._enrich_with_master(product)
    return enriched


@router.get("/tenant-products", response_model=TenantProductListResult)
async def list_tenant_products(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """List all tenant products for the current company."""
    service = TenantProductService(session)
    return await service.list_products(
        company_id=current_user["company_id"],
        skip=skip,
        limit=limit,
    )


@router.get("/tenant-products/{product_id}", response_model=TenantProductRead)
async def get_tenant_product(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Get a tenant product by ID."""
    service = TenantProductService(session)
    try:
        return await service.get_product(product_id, current_user["company_id"])
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/tenant-products/{product_id}", response_model=TenantProductRead)
async def update_tenant_product(
    product_id: str,
    payload: TenantProductUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Update tenant product price and stock.

    Admin and Super Admin can update.
    """
    if current_user["role"] not in {"Admin", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    service = TenantProductService(session)
    try:
        result = await service.update_product(product_id, current_user["company_id"], payload)
        await service.repository.commit()
        return result
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/tenant-products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant_product(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Delete a tenant product.

    Admin and Super Admin can delete.
    """
    if current_user["role"] not in {"Admin", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    service = TenantProductService(session)
    try:
        await service.delete_product(product_id, current_user["company_id"])
        await service.repository.commit()
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
