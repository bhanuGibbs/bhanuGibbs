from __future__ import annotations

from pydantic import BaseModel, Field


class RoleBase(BaseModel):
    """Shared properties for role operations."""

    name: str = Field(..., min_length=3, max_length=50)
    description: str | None = Field(default=None, max_length=255)


class RoleCreate(RoleBase):
    """Properties required to create a role."""


class RoleRead(RoleBase):
    """Properties returned in role responses."""

    id: str
    created_at: str
    updated_at: str

    model_config = {
        "from_attributes": True,
    }
