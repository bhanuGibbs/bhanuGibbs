from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

revision = '0005'
down_revision = '0004_merge_heads'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("quotations") as batch_op:
        batch_op.add_column(sa.Column("created_by_id", pg.UUID(as_uuid=True), nullable=True))
        batch_op.create_foreign_key(
            "fk_quotations_created_by_id_users", "users", ["created_by_id"], ["id"]
        )


def downgrade() -> None:
    with op.batch_alter_table("quotations") as batch_op:
        batch_op.drop_constraint("fk_quotations_created_by_id_users", type_="foreignkey")
        batch_op.drop_column("created_by_id")
