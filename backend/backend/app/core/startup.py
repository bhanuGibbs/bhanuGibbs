from __future__ import annotations

import asyncio
import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncSession


def escape_alembic_option(value: str) -> str:
    """Escape percent signs so Alembic config can safely store database URLs."""
    return value.replace("%", "%%")

from app.core.database import get_session
from app.services.role_service import RoleService

DEFAULT_ROLES = [
    {"name": "Super Admin", "description": "Full access to all system resources."},
    {"name": "Admin", "description": "Administrative access with management privileges."},
    {"name": "Manager", "description": "Can manage quotations, customers, and products."},
    {"name": "Sales", "description": "Can create and manage quotations for customers."},
    {"name": "Viewer", "description": "Read-only access to system data."},
]


async def seed_roles(session: AsyncSession) -> None:
    """Ensure default roles exist in the database."""
    role_service = RoleService(session)
    for role_data in DEFAULT_ROLES:
        existing_role = await role_service.get_role_by_name(role_data["name"])
        if not existing_role:
            await role_service.create_role(
                name=role_data["name"],
                description=role_data["description"],
            )


async def create_initial_data() -> None:
    """Create database tables, apply migrations, and seed initial roles on startup."""
    backend_root = Path(__file__).resolve().parents[2]
    alembic_ini = backend_root / "alembic.ini"
    config = Config(str(alembic_ini))
    config.set_main_option("script_location", str(backend_root / "alembic"))
    database_url = os.getenv("DATABASE_URL", "")
    config.set_main_option("sqlalchemy.url", escape_alembic_option(database_url))

    await asyncio.to_thread(command.upgrade, config, "head")

    async with get_session() as session:
        await seed_roles(session)
