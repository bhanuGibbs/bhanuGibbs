from __future__ import annotations

import asyncio

from app.core.database import get_session
from app.services.user_service import UserService

ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin123!"
ADMIN_ROLE_NAME = "Admin"


async def main() -> None:
    async with get_session() as session:
        service = UserService(session)
        existing = await service.repository.get_by_username(ADMIN_USERNAME)
        if existing:
            print("Admin user already exists:", existing.username)
            return

        user = await service.create_user(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            role_name=ADMIN_ROLE_NAME,
            is_superuser=True,
        )
        print(
            "Created user:",
            user.username,
            user.email,
            "role_id=",
            user.role_id,
            "superuser=",
            user.is_superuser,
        )


if __name__ == "__main__":
    asyncio.run(main())
