from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.repositories.role_repository import RoleRepository


class RoleService:
    """Service layer for role business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = RoleRepository(session)

    async def get_role_by_name(self, name: str) -> Role | None:
        """Retrieve a role using its unique name."""
        return await self.repository.get_by_name(name)

    async def list_roles(self) -> list[Role]:
        """Return a list of all available roles."""
        return await self.repository.list_all()

    async def create_role(self, name: str, description: str | None = None) -> Role:
        """Create a new role in the database."""
        role = Role(name=name, description=description)
        await self.repository.add(role)
        await self.repository.commit()
        return role
