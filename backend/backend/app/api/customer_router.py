from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
async def create_customer(
    payload: CustomerCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> CustomerRead:
    """Create a new customer."""
    if current_user["role"] not in {"Super Admin", "Admin", "Manager", "Sales"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    service = CustomerService(session)
    customer = await service.create_customer(
        name=payload.name,
        email=payload.email,
        phone_number=payload.phone_number,
        address=payload.address,
        company_name=payload.company_name,
        company_id=current_user["company_id"],
        gstin=payload.gstin,
        country=payload.country,
        state=payload.state,
        city=payload.city,
        pincode=payload.pincode,
        created_by_id=current_user["id"],
    )
    return CustomerRead.from_orm(customer)


@router.get("/", response_model=list[CustomerRead])
async def list_customers(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[CustomerRead]:
    """List customers for the current user's company."""
    service = CustomerService(session)
    if not current_user["company_id"]:
        return []
    customers = await service.list_customers(current_user["company_id"], current_user["id"])
    return [CustomerRead.from_orm(customer) for customer in customers]


@router.get("/{customer_id}", response_model=CustomerRead)
async def get_customer(
    customer_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> CustomerRead:
    """Get a single customer by ID."""
    service = CustomerService(session)
    customer = await service.get_customer(customer_id)
    if not customer or str(customer.company_id) != current_user["company_id"] or str(customer.created_by_id) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    return CustomerRead.from_orm(customer)


@router.put("/{customer_id}", response_model=CustomerRead)
async def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> CustomerRead:
    """Update a customer."""
    service = CustomerService(session)
    customer = await service.get_customer(customer_id)
    if not customer or str(customer.company_id) != current_user["company_id"] or str(customer.created_by_id) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    updated = await service.update_customer(
        customer_id=customer_id,
        name=payload.name,
        email=payload.email,
        phone_number=payload.phone_number,
        address=payload.address,
        company_name=payload.company_name,
        gstin=payload.gstin,
        country=payload.country,
        state=payload.state,
        city=payload.city,
        pincode=payload.pincode,
    )
    return CustomerRead.from_orm(updated)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_customer(
    customer_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a customer."""
    service = CustomerService(session)
    customer = await service.get_customer(customer_id)
    if not customer or str(customer.company_id) != current_user["company_id"] or str(customer.created_by_id) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    await service.delete_customer(customer_id)
