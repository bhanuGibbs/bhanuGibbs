from uuid import uuid4

from alembic import op
import sqlalchemy as sa


revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "quotation_finalization_usage",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("quotation_id", sa.Uuid(), nullable=False),
        sa.Column("finalized_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("quotation_id", name="uq_quotation_finalization_usage_quotation"),
    )
    op.create_index(
        "ix_quotation_finalization_usage_user_date",
        "quotation_finalization_usage",
        ["user_id", "finalized_at"],
    )

    bind = op.get_bind()
    quotations = sa.table(
        "quotations",
        sa.column("id", sa.Uuid()),
        sa.column("created_by_id", sa.Uuid()),
        sa.column("finalized_at", sa.DateTime()),
    )
    usage = sa.table(
        "quotation_finalization_usage",
        sa.column("id", sa.Uuid()),
        sa.column("user_id", sa.Uuid()),
        sa.column("quotation_id", sa.Uuid()),
        sa.column("finalized_at", sa.DateTime()),
    )
    rows = bind.execute(
        sa.select(quotations.c.id, quotations.c.created_by_id, quotations.c.finalized_at).where(
            quotations.c.finalized_at.is_not(None),
            quotations.c.created_by_id.is_not(None),
        )
    ).all()
    if rows:
        bind.execute(
            usage.insert(),
            [
                {
                    "id": uuid4(),
                    "user_id": row.created_by_id,
                    "quotation_id": row.id,
                    "finalized_at": row.finalized_at,
                }
                for row in rows
            ],
        )


def downgrade() -> None:
    op.drop_index(
        "ix_quotation_finalization_usage_user_date",
        table_name="quotation_finalization_usage",
    )
    op.drop_table("quotation_finalization_usage")
