from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for user-related database operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, User)

    async def get_by_username(self, username: str) -> User | None:
        """Return a user by username."""
        statement = select(User).where(User.username == username)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_by_email(self, email: str) -> User | None:
        """Return a user by email address."""
        statement = select(User).where(User.email == email)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_by_password_reset_token(self, token: str) -> User | None:
        """Return a user by password reset token."""
        statement = select(User).where(User.password_reset_token == token)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_by_email_verification_token(self, token: str) -> User | None:
        """Return a user by email verification token."""
        statement = select(User).where(User.email_verification_token == token)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def list_users(self, business_profile: str | None = None) -> list[User]:
        """Return all users, optionally filtered by business profile."""
        if business_profile:
            statement = (
                select(User)
                .join(Company, User.company_id == Company.id)
                .where(Company.business_profile == business_profile)
            )
        else:
            statement = select(User)
        result = await self.session.execute(statement)
        return result.scalars().all()

    async def list_by_company(self, company_id: str, business_profile: str | None = None) -> list[User]:
        """Return users belonging to one company, optionally filtered by business profile."""
        if business_profile:
            statement = (
                select(User)
                .join(Company, User.company_id == Company.id)
                .where(
                    User.company_id == UUID(company_id),
                    Company.business_profile == business_profile,
                )
            )
        else:
            statement = select(User).where(User.company_id == UUID(company_id))
        result = await self.session.execute(statement)
        return result.scalars().all()

    async def get_for_update(self, user_id: str) -> User | None:
        """Lock a user row while updating subscription state."""
        statement = select(User).where(User.id == UUID(user_id)).with_for_update()
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def clear_user_references(self, user: User) -> None:
        """Remove dependent account data and preserve records owned by this user."""
        from app.models.audit_event import AuditEvent
        from app.models.auth_session import AuthSession
        from app.models.customer import Customer
        from app.models.pos_product import POSProduct
        from app.models.pos_return import POSReturn
        from app.models.pos_stock_movement import POSStockMovement
        from app.models.pos_transaction import POSTransaction
        from app.models.product import Product
        from app.models.quotation import Quotation
        from app.models.quotation_finalization_usage import QuotationFinalizationUsage

        actor_references = (
            (AuditEvent, AuditEvent.actor_user_id),
            (Customer, Customer.created_by_id),
            (POSProduct, POSProduct.created_by_id),
            (POSReturn, POSReturn.created_by_id),
            (POSStockMovement, POSStockMovement.created_by_id),
            (POSTransaction, POSTransaction.created_by_id),
            (Product, Product.created_by_id),
            (Quotation, Quotation.created_by_id),
            (Quotation, Quotation.updated_by_id),
        )
        for model, column in actor_references:
            await self.session.execute(
                update(model).where(column == user.id).values({column.key: None})
            )

        dependent_records = (
            (AuthSession, AuthSession.user_id),
            (QuotationFinalizationUsage, QuotationFinalizationUsage.user_id),
        )
        for model, column in dependent_records:
            await self.session.execute(delete(model).where(column == user.id))
