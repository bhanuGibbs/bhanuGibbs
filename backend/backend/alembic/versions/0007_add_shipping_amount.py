from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "quotations",
        sa.Column("shipping_amount", sa.Numeric(14, 2), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("quotations", "shipping_amount")
