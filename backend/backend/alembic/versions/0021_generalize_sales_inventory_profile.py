"""Rename the ADAM-specific profile to a generic Sales & Inventory profile."""

from alembic import op


revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "UPDATE users SET business_profile = 'sales_inventory' "
        "WHERE business_profile = 'adam_seeds'"
    )
    op.execute(
        "UPDATE companies SET business_profile = 'sales_inventory' "
        "WHERE business_profile = 'adam_seeds'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE users SET business_profile = 'adam_seeds' "
        "WHERE business_profile = 'sales_inventory'"
    )
    op.execute(
        "UPDATE companies SET business_profile = 'adam_seeds' "
        "WHERE business_profile = 'sales_inventory'"
    )
