from alembic import op
import sqlalchemy as sa


revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not sa.inspect(op.get_bind()).has_table("quotation_daily_sequences"):
        op.create_table(
            "quotation_daily_sequences",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("company_id", sa.Uuid(), sa.ForeignKey("companies.id"), nullable=False),
            sa.Column("sequence_date", sa.Date(), nullable=False),
            sa.Column("last_number", sa.Integer(), nullable=False, server_default="0"),
            sa.UniqueConstraint("company_id", "sequence_date", name="uq_quotation_daily_sequences_company_date"),
        )


def downgrade() -> None:
    if sa.inspect(op.get_bind()).has_table("quotation_daily_sequences"):
        op.drop_table("quotation_daily_sequences")
