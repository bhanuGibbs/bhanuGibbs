from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth_session import AuthSession
from app.repositories.base import BaseRepository


class AuthSessionRepository(BaseRepository[AuthSession]):
    """Repository for authentication refresh sessions."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AuthSession)

    async def get_by_token_id(self, token_id: str) -> AuthSession | None:
        statement = select(AuthSession).where(AuthSession.token_id == token_id)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_by_refresh_token(self, refresh_token: str) -> AuthSession | None:
        statement = select(AuthSession).where(AuthSession.refresh_token == refresh_token)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def list_for_user(self, user_id: str) -> list[AuthSession]:
        statement = select(AuthSession).where(AuthSession.user_id == UUID(user_id))
        result = await self.session.execute(statement)
        return result.scalars().all()
