"""Store company logo and seal images."""

from alembic import op
import sqlalchemy as sa


revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("logo_data", sa.Text(), nullable=True))
    op.add_column("companies", sa.Column("seal_data", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("companies", "seal_data")
    op.drop_column("companies", "logo_data")
