from __future__ import annotations

import argparse
import asyncio

from app.core.database import get_session
from app.services.user_service import UserService

DEFAULT_USERNAME = "viewer"
DEFAULT_EMAIL = "viewer@example.com"
DEFAULT_PASSWORD = "Viewer123!"
DEFAULT_ROLE_NAME = "Viewer"


async def create_user(
    username: str,
    email: str,
    password: str,
    role_name: str,
    is_superuser: bool = False,
) -> None:
    async with get_session() as session:
        service = UserService(session)
        existing = await service.repository.get_by_username(username)
        if existing:
            print(f"User already exists: {username}")
            return

        user = await service.create_user(
            username=username,
            email=email,
            password=password,
            role_name=role_name,
            is_superuser=is_superuser,
        )

        print("Created user:")
        print("  username:", user.username)
        print("  email:", user.email)
        print("  role:", role_name)
        print("  role_id:", user.role_id)
        print("  superuser:", user.is_superuser)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a new user in the backend with a specific role."
    )
    parser.add_argument("--username", "-u", default=DEFAULT_USERNAME, help="Username for the new user")
    parser.add_argument("--email", "-e", default=DEFAULT_EMAIL, help="Email address for the new user")
    parser.add_argument("--password", "-p", default=DEFAULT_PASSWORD, help="Password for the new user")
    parser.add_argument("--role", "-r", default=DEFAULT_ROLE_NAME, help="Role name to assign to the new user")
    parser.add_argument(
        "--superuser",
        "-s",
        action="store_true",
        help="Mark the new user as superuser",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(
        create_user(
            username=args.username,
            email=args.email,
            password=args.password,
            role_name=args.role,
            is_superuser=args.superuser,
        )
    )
