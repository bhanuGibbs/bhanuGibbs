from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RoleBase(BaseModel):
    """Shared properties for role operations."""

    name: str = Field(..., min_length=3, max_length=50)
    description: str | None = Field(default=None, max_length=255)


class RoleCreate(RoleBase):
    """Properties required to create a role."""


class RoleRead(RoleBase):
    """Properties returned in role responses."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }
