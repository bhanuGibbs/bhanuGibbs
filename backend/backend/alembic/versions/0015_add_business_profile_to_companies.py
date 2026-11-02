"""Add business_profile column to companies table."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add business_profile column to companies table."""
    op.add_column(
        "companies",
        sa.Column("business_profile", sa.String(length=20), nullable=True, server_default="invoice"),
    )
    # Set existing companies to 'invoice' profile (default behavior)
    op.execute("UPDATE companies SET business_profile = 'invoice' WHERE business_profile IS NULL")
    op.alter_column("companies", "business_profile", nullable=False)


def downgrade() -> None:
    """Remove business_profile column from companies table."""
    op.drop_column("companies", "business_profile")
