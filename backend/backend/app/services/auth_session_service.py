from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth_session import AuthSession
from app.repositories.auth_session_repository import AuthSessionRepository
from app.services.exceptions import NotFoundError
from app.core.config import get_settings

settings = get_settings()


class AuthSessionService:
    """Service for refresh token session lifecycle management."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = AuthSessionRepository(session)

    async def create_session(
        self,
        user_id: str,
        refresh_token: str,
        token_id: str,
        commit: bool = True,
    ) -> AuthSession:
        """Create a refresh token session record."""
        expires_at = datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expires_days)
        session = AuthSession(
            user_id=uuid.UUID(user_id),
            refresh_token_hash=self.hash_token(refresh_token),
            token_id=token_id,
            expires_at=expires_at,
            last_used_at=datetime.utcnow(),
        )
        await self.repository.add(session)
        if commit:
            await self.repository.commit()
        return session

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    async def get_session_by_token(self, refresh_token: str) -> AuthSession | None:
        """Return a refresh session by a hash of its token."""
        return await self.repository.get_by_refresh_token_hash(self.hash_token(refresh_token))

    async def get_session_by_token_id(self, token_id: str, for_update: bool = False) -> AuthSession | None:
        return await self.repository.get_by_token_id(token_id, for_update=for_update)

    async def revoke_session(self, token_id: str, commit: bool = True) -> None:
        """Revoke a refresh session by token id."""
        session = await self.repository.get_by_token_id(token_id)
        if not session:
            raise NotFoundError("Session not found.")
        await self.repository.delete(session)
        if commit:
            await self.repository.commit()

    async def revoke_all_sessions_for_user(self, user_id: str, commit: bool = True) -> None:
        """Remove all refresh token sessions for a user."""
        sessions = await self.repository.list_for_user(user_id)
        for session in sessions:
            await self.repository.delete(session)
        if commit:
            await self.repository.commit()
