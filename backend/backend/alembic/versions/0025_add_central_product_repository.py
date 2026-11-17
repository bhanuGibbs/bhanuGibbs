"""Add central product repository tables and business_type to companies.

Creates master_products and tenant_products tables for the centralized
product catalog system, and adds business_type column to companies.
"""

from alembic import op
import sqlalchemy as sa


revision = "0025"
down_revision = "0024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add business_type column to companies
    op.add_column("companies", sa.Column("business_type", sa.String(length=50), nullable=True))

    # Create master_products table
    op.create_table(
        "master_products",
        sa.Column("business_type", sa.String(length=50), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("barcode", sa.String(length=100), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("unit", sa.String(length=50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sku"),
    )
    op.create_index("ix_master_products_business_type", "master_products", ["business_type"])
    op.create_index("ix_master_products_sku", "master_products", ["sku"])
    op.create_index("ix_master_products_barcode", "master_products", ["barcode"])
    op.create_index("ix_master_products_product_name", "master_products", ["product_name"])
    op.create_index("ix_master_products_is_active", "master_products", ["is_active"])
    op.create_index(
        "ix_master_products_business_type_active", "master_products", ["business_type", "is_active"]
    )

    # Create tenant_products table
    op.create_table(
        "tenant_products",
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("master_product_id", sa.Uuid(), nullable=True),
        sa.Column("selling_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("stock_qty", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("low_stock_threshold", sa.Integer(), nullable=False, server_default=sa.text("5")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["master_product_id"], ["master_products.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "master_product_id", name="uq_tenant_company_master_product"),
    )
    op.create_index("ix_tenant_products_company_id", "tenant_products", ["company_id"])
    op.create_index("ix_tenant_products_master_product_id", "tenant_products", ["master_product_id"])


def downgrade() -> None:
    op.drop_table("tenant_products")
    op.drop_table("master_products")
    op.drop_column("companies", "business_type")
