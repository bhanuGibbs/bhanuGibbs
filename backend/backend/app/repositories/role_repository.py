from __future__ import annotations

from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    """Repository for role-related database operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Role)

    async def get_by_name(self, name: str) -> Role | None:
        """Return a role by its name."""
        statement = select(Role).where(Role.name == name)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def list_all(self) -> List[Role]:
        """Return all roles in the database."""
        statement = select(Role)
        result = await self.session.execute(statement)
        return result.scalars().all()
