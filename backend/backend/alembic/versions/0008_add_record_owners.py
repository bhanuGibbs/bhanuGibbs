from alembic import op
import sqlalchemy as sa


revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("customers") as batch_op:
        batch_op.add_column(sa.Column("created_by_id", sa.Uuid(), nullable=True))
        batch_op.create_foreign_key(
            "fk_customers_created_by_id_users", "users", ["created_by_id"], ["id"]
        )
    op.create_index("ix_customers_created_by_id", "customers", ["created_by_id"])

    with op.batch_alter_table("products") as batch_op:
        batch_op.add_column(sa.Column("created_by_id", sa.Uuid(), nullable=True))
        batch_op.create_foreign_key(
            "fk_products_created_by_id_users", "users", ["created_by_id"], ["id"]
        )
    op.create_index("ix_products_created_by_id", "products", ["created_by_id"])


def downgrade() -> None:
    op.drop_index("ix_products_created_by_id", table_name="products")
    with op.batch_alter_table("products") as batch_op:
        batch_op.drop_constraint("fk_products_created_by_id_users", type_="foreignkey")
        batch_op.drop_column("created_by_id")

    op.drop_index("ix_customers_created_by_id", table_name="customers")
    with op.batch_alter_table("customers") as batch_op:
        batch_op.drop_constraint("fk_customers_created_by_id_users", type_="foreignkey")
        batch_op.drop_column("created_by_id")
