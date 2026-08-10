from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class CompanyBase(BaseModel):
    """Shared company schema fields."""

    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = Field(default=None, max_length=512)
    phone_number: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    website: HttpUrl | None = None


class CompanyCreate(CompanyBase):
    """Properties required to create a new company."""


class CompanyRead(CompanyBase):
    """Properties returned in company responses."""

    id: str
    created_at: str
    updated_at: str

    model_config = {
        "from_attributes": True,
    }
