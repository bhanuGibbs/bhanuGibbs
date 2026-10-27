from alembic import op
import sqlalchemy as sa


revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "quotations",
        sa.Column("finalized_at", sa.DateTime(), nullable=True),
    )
    op.execute(
        "UPDATE quotations SET finalized_at = updated_at "
        "WHERE status <> 'Draft' AND finalized_at IS NULL"
    )


def downgrade() -> None:
    op.drop_column("quotations", "finalized_at")
