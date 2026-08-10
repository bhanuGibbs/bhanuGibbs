from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.repositories.customer_repository import CustomerRepository
from app.services.exceptions import ConflictError, NotFoundError


class CustomerService:
    """Service layer for customer business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = CustomerRepository(session)

    async def create_customer(
        self,
        name: str,
        email: str | None = None,
        phone_number: str | None = None,
        address: str | None = None,
        company_name: str | None = None,
        company_id: str | None = None,
    ) -> Customer:
        """Create a new customer record within a company."""
        if email:
            existing = await self.repository.get_by_email(email, company_id)
            if existing:
                raise ConflictError("Customer with this email already exists.")

        customer = Customer(
            name=name,
            email=email,
            phone_number=phone_number,
            address=address,
            company_name=company_name,
            company_id=company_id,
        )
        await self.repository.add(customer)
        await self.repository.commit()
        return customer

    async def list_customers(self, company_id: str) -> list[Customer]:
        """Return a list of customers for a company."""
        return await self.repository.list_by_company(company_id)

    async def get_customer(self, customer_id: str) -> Customer | None:
        """Retrieve a customer by UUID."""
        return await self.repository.get(customer_id)

    async def update_customer(
        self,
        customer_id: str,
        name: str | None = None,
        email: str | None = None,
        phone_number: str | None = None,
        address: str | None = None,
        company_name: str | None = None,
    ) -> Customer:
        """Update an existing customer."""
        customer = await self.repository.get(customer_id)
        if not customer:
            raise NotFoundError("Customer not found.")

        if name is not None:
            customer.name = name
        if email is not None:
            customer.email = email
        if phone_number is not None:
            customer.phone_number = phone_number
        if address is not None:
            customer.address = address
        if company_name is not None:
            customer.company_name = company_name

        await self.repository.commit()
        return customer

    async def delete_customer(self, customer_id: str) -> None:
        """Delete a customer."""
        customer = await self.repository.get(customer_id)
        if not customer:
            raise NotFoundError("Customer not found.")

        await self.repository.delete(customer)
        await self.repository.commit()
