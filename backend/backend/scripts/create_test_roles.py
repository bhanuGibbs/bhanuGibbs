from __future__ import annotations

import asyncio

from app.core.database import get_session
from app.services.role_service import RoleService

TEST_ROLES = [
    {"name": "Super Admin", "description": "Default super admin role."},
    {"name": "Admin", "description": "Default admin role."},
    {"name": "Manager", "description": "Default manager role."},
    {"name": "Sales", "description": "Default sales role."},
    {"name": "Viewer", "description": "Default viewer role."},
]


async def create_roles() -> None:
    async with get_session() as session:
        service = RoleService(session)
        for role_data in TEST_ROLES:
            existing = await service.get_role_by_name(role_data["name"])
            if not existing:
                await service.create_role(name=role_data["name"], description=role_data["description"])


if __name__ == "__main__":
    asyncio.run(create_roles())
