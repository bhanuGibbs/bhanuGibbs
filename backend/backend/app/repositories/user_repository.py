from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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

    async def list_users(self) -> list[User]:
        """Return all users."""
        statement = select(User)
        result = await self.session.execute(statement)
        return result.scalars().all()

    async def list_by_company(self, company_id: str) -> list[User]:
        """Return users belonging to one company."""
        statement = select(User).where(User.company_id == UUID(company_id))
        result = await self.session.execute(statement)
        return result.scalars().all()

    async def get_for_update(self, user_id: str) -> User | None:
        """Lock a user row while updating subscription state."""
        statement = select(User).where(User.id == UUID(user_id)).with_for_update()
        result = await self.session.execute(statement)
        return result.scalars().first()
