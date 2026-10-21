from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

revision = '0003_add_user_profile_fields'
down_revision = '0002_add_domain_models'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("company_id", pg.UUID(as_uuid=True), nullable=True))
        batch_op.create_foreign_key(
            "fk_users_company_id_companies", "companies", ["company_id"], ["id"]
        )
        batch_op.add_column(
            sa.Column("is_profile_complete", sa.Boolean(), nullable=False, server_default=sa.text("false"))
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("is_profile_complete")
        batch_op.drop_column("company_id")
