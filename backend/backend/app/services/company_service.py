from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.repositories.company_repository import CompanyRepository
from app.services.exceptions import ConflictError


class CompanyService:
    """Service layer for company business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = CompanyRepository(session)

    async def create_company(
        self,
        name: str,
        address: str | None = None,
        phone_number: str | None = None,
        email: str | None = None,
        website: str | None = None,
        gstin: str | None = None,
        country: str | None = None,
        state: str | None = None,
        city: str | None = None,
        pincode: str | None = None,
        commit: bool = True,
    ) -> Company:
        """Create a new company in the system."""
        existing = await self.repository.get_by_name(name)
        if existing:
            raise ConflictError("Company with this name already exists.")

        # pydantic's HttpUrl/Url types may be passed in from request payloads;
        # ensure we store plain strings in the DB to avoid driver type errors.
        company = Company(
            name=name,
            address=address,
            phone_number=phone_number,
            email=str(email) if email is not None else None,
            website=str(website) if website is not None else None,
            gstin=gstin,
            country=country,
            state=state,
            city=city,
            pincode=pincode,
        )
        await self.repository.add(company)
        if commit:
            await self.repository.commit()
        return company

    async def list_companies(self) -> list[Company]:
        """List all companies."""
        return await self.repository.list_all()

    async def get_company(self, company_id: str) -> Company | None:
        """Return a company by its UUID."""
        return await self.repository.get(company_id)
