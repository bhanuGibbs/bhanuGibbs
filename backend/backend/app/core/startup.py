from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.services.role_service import RoleService

logger = logging.getLogger(__name__)

DEFAULT_ROLES = [
    {"name": "Super Admin", "description": "Full system access: manage all users, roles, and subscription plans across all companies."},
    {"name": "Admin", "description": "Company-level access: manage users, products, customers, and quotations within the same company."},
    {"name": "Sales", "description": "Can create and manage quotations, customers, and products."},
]


async def seed_roles(session: AsyncSession) -> None:
    """Ensure default roles exist in the database, updating descriptions if they have changed."""
    role_service = RoleService(session)
    for role_data in DEFAULT_ROLES:
        existing_role = await role_service.get_role_by_name(role_data["name"])
        if existing_role:
            # Update the description if it has changed
            if existing_role.description != role_data["description"]:
                existing_role.description = role_data["description"]
                await role_service.save()
        else:
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
    settings = get_settings()
    db_url = settings.database_url or ""
    config.set_main_option("sqlalchemy.url", str(db_url).replace("%", "%%"))

    try:
        await asyncio.to_thread(command.upgrade, config, "head")
        logger.info("Alembic migrations applied successfully.")
    except Exception as e:
        logger.error("Alembic migration failed: %s. The application may not function correctly with an outdated database schema.", e)
        # Re-raise to prevent the application from starting with an incomplete schema
        raise

    try:
        async with get_session() as session:
            await seed_roles(session)
        logger.info("Default roles seeded successfully.")
    except Exception as e:
        logger.error("Role seeding failed: %s. Default roles may be missing.", e)
        raise
