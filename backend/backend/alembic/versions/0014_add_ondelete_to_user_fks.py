"""Add ondelete rules to user foreign keys so user deletion doesn't fail."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add ondelete rules to foreign keys referencing users.id."""

    # auth_sessions.user_id -> CASCADE (delete sessions when user is deleted)
    with op.batch_alter_table("auth_sessions") as batch:
        batch.drop_constraint("fk_auth_sessions_user_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_auth_sessions_user_id_users", "users", ["user_id"], ["id"], ondelete="CASCADE"
        )

    # customers.created_by_id -> SET NULL
    with op.batch_alter_table("customers") as batch:
        batch.drop_constraint("fk_customers_created_by_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_customers_created_by_id_users", "users", ["created_by_id"], ["id"], ondelete="SET NULL"
        )

    # products.created_by_id -> SET NULL
    with op.batch_alter_table("products") as batch:
        batch.drop_constraint("fk_products_created_by_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_products_created_by_id_users", "users", ["created_by_id"], ["id"], ondelete="SET NULL"
        )

    # quotations.created_by_id -> SET NULL
    with op.batch_alter_table("quotations") as batch:
        batch.drop_constraint("fk_quotations_created_by_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_quotations_created_by_id_users", "users", ["created_by_id"], ["id"], ondelete="SET NULL"
        )

    # quotations.updated_by_id -> SET NULL
    with op.batch_alter_table("quotations") as batch:
        batch.drop_constraint("fk_quotations_updated_by_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_quotations_updated_by_id_users", "users", ["updated_by_id"], ["id"], ondelete="SET NULL"
        )

    # quotation_finalization_usage.user_id -> CASCADE
    with op.batch_alter_table("quotation_finalization_usage") as batch:
        batch.drop_constraint("fk_quotation_finalization_usage_user_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_quotation_finalization_usage_user_id_users",
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )


def downgrade() -> None:
    """Remove ondelete rules from foreign keys referencing users.id."""

    with op.batch_alter_table("quotation_finalization_usage") as batch:
        batch.drop_constraint("fk_quotation_finalization_usage_user_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_quotation_finalization_usage_user_id_users", "users", ["user_id"], ["id"]
        )

    with op.batch_alter_table("quotations") as batch:
        batch.drop_constraint("fk_quotations_updated_by_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_quotations_updated_by_id_users", "users", ["updated_by_id"], ["id"]
        )

    with op.batch_alter_table("quotations") as batch:
        batch.drop_constraint("fk_quotations_created_by_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_quotations_created_by_id_users", "users", ["created_by_id"], ["id"]
        )

    with op.batch_alter_table("products") as batch:
        batch.drop_constraint("fk_products_created_by_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_products_created_by_id_users", "users", ["created_by_id"], ["id"]
        )

    with op.batch_alter_table("customers") as batch:
        batch.drop_constraint("fk_customers_created_by_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_customers_created_by_id_users", "users", ["created_by_id"], ["id"]
        )

    with op.batch_alter_table("auth_sessions") as batch:
        batch.drop_constraint("fk_auth_sessions_user_id_users", type_="foreignkey")
        batch.create_foreign_key(
            "fk_auth_sessions_user_id_users", "users", ["user_id"], ["id"]
        )
