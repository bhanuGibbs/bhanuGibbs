"""Add email verification fields to users table."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add email verification columns to the users table."""

    op.add_column(
        "users",
        sa.Column("email_verification_token", sa.String(length=255), nullable=True, index=True),
    )
    op.add_column(
        "users",
        sa.Column("email_verification_expires_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("is_email_verified", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade() -> None:
    """Remove email verification columns from the users table."""

    op.drop_column("users", "is_email_verified")
    op.drop_column("users", "email_verification_expires_at")
    op.drop_column("users", "email_verification_token")
