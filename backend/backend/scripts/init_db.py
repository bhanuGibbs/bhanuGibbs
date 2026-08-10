from __future__ import annotations

import asyncio

from app.core.database import engine
from app.core.startup import seed_roles
from app.models.base import BaseModel
from app.core.database import get_session
from app.models import role, user, company, customer, product, quotation, quotation_item


async def init_database() -> None:
    """Create database tables and seed initial roles."""
    async with engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.create_all)

    async with get_session() as session:
        await seed_roles(session)


if __name__ == "__main__":
    asyncio.run(init_database())
