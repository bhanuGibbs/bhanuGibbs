from __future__ import annotations

import asyncio

from app.core.database import get_session
from app.services.role_service import RoleService
from app.services.user_service import UserService

USERNAME = "adminuser1"
EMAIL = "adminuser1@example.com"
PASSWORD = "Password123!"
ROLE_NAME = "Admin"


async def ensure_role() -> None:
    async with get_session() as session:
        service = RoleService(session)
        existing = await service.get_role_by_name(ROLE_NAME)
        if existing:
            print(f"Role already exists: {ROLE_NAME}")
            return
        await service.create_role(name=ROLE_NAME, description="Default admin role.")
        print(f"Created role: {ROLE_NAME}")


async def create_user() -> None:
    async with get_session() as session:
        service = UserService(session)
        existing = await service.repository.get_by_username(USERNAME)
        if existing:
            print(f"User already exists: {USERNAME}")
            return

        user = await service.create_user(
            username=USERNAME,
            email=EMAIL,
            password=PASSWORD,
            role_name=ROLE_NAME,
            is_superuser=False,
        )
        print("Created user:")
        print(f"  username: {user.username}")
        print(f"  email: {user.email}")
        print(f"  role: {ROLE_NAME}")
        print(f"  role_id: {user.role_id}")


async def main() -> None:
    await ensure_role()
    await create_user()


if __name__ == "__main__":
    asyncio.run(main())
