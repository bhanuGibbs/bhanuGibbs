from __future__ import annotations

from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

ModelType = TypeVar("ModelType", bound=DeclarativeBase)


class BaseRepository(Generic[ModelType]):
    """Generic base repository for CRUD operations."""

    def __init__(self, session: AsyncSession, model: type[ModelType]) -> None:
        self.session = session
        self.model = model

    async def add(self, instance: ModelType) -> ModelType:
        """Add a model instance to the session and return it."""
        # Defensive coercion: convert pydantic Url/HttpUrl values to plain strings
        # to avoid DB driver errors where the driver expects native str types.
        if hasattr(instance, "__table__"):
            for col in instance.__table__.columns:
                name = col.name
                try:
                    val = getattr(instance, name)
                except Exception:
                    val = None
                if val is None:
                    continue
                if not isinstance(val, (str, bytes, int, float, bool)):
                    cls_name = val.__class__.__name__
                    if cls_name in ("Url", "HttpUrl", "AnyUrl"):
                        try:
                            setattr(instance, name, str(val))
                        except Exception:
                            pass

        self.session.add(instance)
        await self.session.flush()
        return instance

    async def get(self, id_: object) -> ModelType | None:
        """Get a model instance by primary key."""
        if isinstance(id_, str):
            try:
                id_ = UUID(id_)
            except ValueError:
                return None
        return await self.session.get(self.model, id_)

    async def delete(self, instance: ModelType) -> None:
        """Delete a model instance from the session."""
        await self.session.delete(instance)

    async def commit(self) -> None:
        """Commit the current transaction."""
        await self.session.commit()

    async def flush(self) -> None:
        """Flush pending changes to the database."""
        await self.session.flush()

    async def rollback(self) -> None:
        """Rollback the current transaction."""
        await self.session.rollback()
