"""Store the selected business profile during registration."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "business_profile",
            sa.String(length=20),
            nullable=False,
            server_default="invoice",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "business_profile")
