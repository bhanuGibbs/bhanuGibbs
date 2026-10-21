from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ProductRead:
    """Create a new product."""
    if current_user["role"] not in {"Super Admin", "Admin", "Manager", "Sales"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    service = ProductService(session)
    product = await service.create_product(
        name=payload.name,
        price=payload.price,
        description=payload.description,
        sku=payload.sku,
        gst_percentage=payload.gst_percentage,
        unit=payload.unit,
        hsn_code=payload.hsn_code,
        company_id=current_user["company_id"],
        created_by_id=current_user["id"],
    )
    return ProductRead.from_orm(product)


@router.get("/", response_model=list[ProductRead])
async def list_products(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[ProductRead]:
    """List products for the current user's company."""
    service = ProductService(session)
    if not current_user["company_id"]:
        return []
    products = await service.list_products(current_user["company_id"], current_user["id"])
    return [ProductRead.from_orm(product) for product in products]


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ProductRead:
    """Get a single product by ID."""
    service = ProductService(session)
    product = await service.get_product(product_id)
    if not product or str(product.company_id) != current_user["company_id"] or str(product.created_by_id) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return ProductRead.from_orm(product)


@router.put("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ProductRead:
    """Update a product."""
    service = ProductService(session)
    product = await service.get_product(product_id)
    if not product or str(product.company_id) != current_user["company_id"] or str(product.created_by_id) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    updated = await service.update_product(
        product_id=product_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        sku=payload.sku,
        gst_percentage=payload.gst_percentage,
        unit=payload.unit,
        hsn_code=payload.hsn_code,
    )
    return ProductRead.from_orm(updated)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_product(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a product."""
    service = ProductService(session)
    product = await service.get_product(product_id)
    if not product or str(product.company_id) != current_user["company_id"] or str(product.created_by_id) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    await service.delete_product(product_id)
