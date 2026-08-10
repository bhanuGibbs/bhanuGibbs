from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TimestampMixin:
    """Mixin that adds created and updated timestamps to a model."""

    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class UUIDMixin:
    """Mixin that adds a UUID primary key to a model."""

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )


class BaseModel(Base, TimestampMixin, UUIDMixin):
    """Base declarative model with UUID and timestamp behavior."""

    __abstract__ = True
