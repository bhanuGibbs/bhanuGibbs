from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from app.schemas.master_product import (
    MasterProductCreate,
    MasterProductImportResult,
    MasterProductRead,
    MasterProductSearchResult,
    MasterProductUpdate,
    MasterProductBusinessTypes,
)
from app.services.master_product_service import MasterProductService
from app.services.exceptions import ConflictError, NotFoundError

router = APIRouter(prefix="/master-products", tags=["Master Products"])


@router.get("/business-types", response_model=MasterProductBusinessTypes)
async def get_business_types():
    """Get list of valid business types."""
    return MasterProductBusinessTypes()


@router.get("/", response_model=MasterProductSearchResult)
async def search_master_products(
    q: str | None = Query(default=None, description="Search query"),
    business_type: str | None = Query(default=None, description="Filter by business type"),
    active_only: bool = Query(default=True, description="Only show active products"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Search master products with filtering and pagination.

    Admin and Super Admin can search all products.
    Regular users can only search products matching their company's business type.
    """
    service = MasterProductService(session)

    # If user is not Super Admin, filter by their company's business type
    user_business_type = business_type
    if current_user["role"] not in ("Super Admin", "Admin") and not business_type:
        # Use the company's business_type if set
        user_business_type = current_user.get("company_business_type")

    result = await service.search_products(
        query=q,
        business_type=user_business_type,
        active_only=active_only,
        skip=skip,
        limit=limit,
    )
    return result


@router.post("/", response_model=MasterProductRead, status_code=status.HTTP_201_CREATED)
async def create_master_product(
    payload: MasterProductCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Create a new master product. Admin and Super Admin can create."""
    if current_user["role"] not in ("Super Admin", "Admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin and Super Admin can create master products.",
        )

    service = MasterProductService(session)
    try:
        product = await service.create_product(payload)
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    return MasterProductRead.model_validate(MasterProductService._to_read(product))


@router.get("/{product_id}", response_model=MasterProductRead)
async def get_master_product(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Get a master product by ID."""
    service = MasterProductService(session)
    try:
        product = await service.get_product(product_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    return MasterProductRead.model_validate(MasterProductService._to_read(product))


@router.put("/{product_id}", response_model=MasterProductRead)
async def update_master_product(
    product_id: str,
    payload: MasterProductUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Update a master product. Admin and Super Admin can update."""
    if current_user["role"] not in ("Super Admin", "Admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin and Super Admin can update master products.",
        )

    service = MasterProductService(session)
    try:
        product = await service.update_product(product_id, payload)
    except (NotFoundError, ConflictError) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, NotFoundError) else status.HTTP_409_CONFLICT
        raise HTTPException(status_code=status_code, detail=str(e))

    return MasterProductRead.model_validate(MasterProductService._to_read(product))


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_master_product(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Deactivate a master product (soft delete). Admin and Super Admin can deactivate."""
    if current_user["role"] not in ("Super Admin", "Admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin and Super Admin can deactivate master products.",
        )

    service = MasterProductService(session)
    try:
        await service.deactivate_product(product_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/import", response_model=MasterProductImportResult)
async def bulk_import_master_products(
    file: UploadFile = File(...),
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Bulk import master products from CSV file.

    CSV format: BusinessType,ProductName,SKU,Barcode,Category,Unit,Description
    If SKU exists -> update product
    If SKU doesn't exist -> create new product

    Admin and Super Admin can import.
    """
    if current_user["role"] not in ("Super Admin", "Admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin and Super Admin can import master products.",
        )

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported.",
        )

    content = await file.read()
    csv_content = content.decode("utf-8")

    service = MasterProductService(session)
    result = await service.bulk_import(csv_content)
    return result
