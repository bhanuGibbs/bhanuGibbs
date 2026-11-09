from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session, require_business_profile
from app.schemas.challan_product import ChallanProductCreate, ChallanProductRead, ChallanProductUpdate
from app.services.challan_product_service import ChallanProductService

router = APIRouter(
    prefix="/challan-products",
    tags=["Challan Products"],
    dependencies=[Depends(require_business_profile("invoice", "pos", "delivery_challan"))],
)


@router.post("/", response_model=ChallanProductRead, status_code=status.HTTP_201_CREATED)
async def create_challan_product(
    payload: ChallanProductCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ChallanProductRead:
    """Create a new challan product. Sales, Admin and Super Admin can create."""
    if current_user["role"] not in {"Sales", "Admin", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    service = ChallanProductService(session)
    product = await service.create_challan_product(
        crop=payload.crop,
        value=payload.value,
        variety=payload.variety,
        seed_class=payload.seed_class,
        lot_no=payload.lot_no,
        unit_size=payload.unit_size,
        unit_per_sack_box=payload.unit_per_sack_box,
        sack_box=payload.sack_box,
        company_id=current_user["company_id"],
        created_by_id=current_user["id"],
    )
    return ChallanProductRead.from_orm(product)


@router.get("/", response_model=list[ChallanProductRead])
async def list_challan_products(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[ChallanProductRead]:
    """List challan products for the current user's company."""
    service = ChallanProductService(session)
    if not current_user["company_id"]:
        return []
    products = await service.list_challan_products(current_user["company_id"], current_user["id"])
    return [ChallanProductRead.from_orm(product) for product in products]


@router.get("/{product_id}", response_model=ChallanProductRead)
async def get_challan_product(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ChallanProductRead:
    """Get a single challan product by ID. Any user in the company can view."""
    service = ChallanProductService(session)
    product = await service.get_challan_product(product_id)
    if not product or str(product.company_id) != current_user["company_id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challan product not found.")
    return ChallanProductRead.from_orm(product)


@router.put("/{product_id}", response_model=ChallanProductRead)
async def update_challan_product(
    product_id: str,
    payload: ChallanProductUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ChallanProductRead:
    """Update a challan product. Sales, Admin and Super Admin can update."""
    if current_user["role"] not in {"Sales", "Admin", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )
    service = ChallanProductService(session)
    product = await service.get_challan_product(product_id)
    if not product or str(product.company_id) != current_user["company_id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challan product not found.")

    updated = await service.update_challan_product(
        product_id=product_id,
        crop=payload.crop,
        variety=payload.variety,
        seed_class=payload.seed_class,
        lot_no=payload.lot_no,
        unit_size=payload.unit_size,
        unit_per_sack_box=payload.unit_per_sack_box,
        sack_box=payload.sack_box,
        value=payload.value,
    )
    return ChallanProductRead.from_orm(updated)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_challan_product(
    product_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a challan product. Sales, Admin and Super Admin can delete."""
    if current_user["role"] not in {"Sales", "Admin", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )
    service = ChallanProductService(session)
    product = await service.get_challan_product(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challan product not found.")
    if str(product.company_id) != current_user["company_id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challan product not found.")

    await service.delete_challan_product(product_id)
