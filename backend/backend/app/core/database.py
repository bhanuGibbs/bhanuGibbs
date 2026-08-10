from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    """Base declarative class for SQLAlchemy ORM models."""


def get_engine() -> AsyncEngine:
    """Create and return an asynchronous SQLAlchemy engine."""
    return create_async_engine(settings.database_url, echo=settings.debug, future=True)


engine: AsyncEngine = get_engine()

async_session: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


def get_session() -> AsyncSession:
    """Create and return a new asynchronous database session."""
    return async_session()
