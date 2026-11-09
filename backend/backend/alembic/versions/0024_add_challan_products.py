"""Add challan products table for agriculture-specific challan items."""

from alembic import op
import sqlalchemy as sa


revision = "0024"
down_revision = "0023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "challan_products",
        sa.Column("company_id", sa.Uuid(), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("crop", sa.String(length=255), nullable=False),
        sa.Column("variety", sa.String(length=255), nullable=True),
        sa.Column("seed_class", sa.String(length=100), nullable=True),
        sa.Column("lot_no", sa.String(length=100), nullable=True),
        sa.Column("unit_size", sa.String(length=50), nullable=True),
        sa.Column("unit_per_sack_box", sa.Integer(), nullable=True),
        sa.Column("sack_box", sa.Integer(), nullable=True),
        sa.Column("value", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint("value >= 0", name="ck_challan_product_value_nonnegative"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_challan_products_company_id", "challan_products", ["company_id"])
    op.create_index("ix_challan_products_created_by_id", "challan_products", ["created_by_id"])


def downgrade() -> None:
    op.drop_table("challan_products")
