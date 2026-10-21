from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from app.schemas.company import CompanyCreate, CompanyRead
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("/", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
async def create_company(
    payload: CompanyCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> CompanyRead:
    """Create a new company."""
    if current_user["role"] not in {"Super Admin", "Admin", "Manager"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    service = CompanyService(session)
    company = await service.create_company(
        name=payload.name,
        address=payload.address,
        phone_number=payload.phone_number,
        email=payload.email,
        website=payload.website,
        gstin=payload.gstin,
        country=payload.country,
        state=payload.state,
        city=payload.city,
        pincode=payload.pincode,
    )
    return CompanyRead.from_orm(company)


@router.get("/", response_model=list[CompanyRead])
async def list_companies(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[CompanyRead]:
    """List only the authenticated user's company."""
    service = CompanyService(session)
    if not current_user["company_id"]:
        return []
    company = await service.get_company(current_user["company_id"])
    return [CompanyRead.from_orm(company)] if company else []
