from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_event import AuditEvent


class AuditEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_for_resource(self, resource_id: str) -> list[AuditEvent]:
        statement = (
            select(AuditEvent)
            .where(AuditEvent.resource_type == "quotation", AuditEvent.resource_id == UUID(resource_id))
            .order_by(AuditEvent.created_at, AuditEvent.id)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())
