from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

class Base(DeclarativeBase):
    """Base declarative class for SQLAlchemy ORM models."""


_engine: AsyncEngine | None = None


def get_engine() -> AsyncEngine:
    """Create and return an asynchronous SQLAlchemy engine (lazy initialization)."""
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(settings.database_url, echo=settings.debug, future=True)
    return _engine

_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Create and return the async session factory (lazy initialization)."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            expire_on_commit=False,
            class_=AsyncSession,
        )
    return _session_factory


def get_session() -> AsyncSession:
    """Create and return a new asynchronous database session."""
    return get_session_factory()()
