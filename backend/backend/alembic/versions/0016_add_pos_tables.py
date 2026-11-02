"""Add POS tables for billing and inventory management."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all POS tables."""

    # pos_categories
    op.create_table(
        "pos_categories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=512), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_categories_company_id", "pos_categories", ["company_id"])

    # pos_products
    op.create_table(
        "pos_products",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("barcode", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("purchase_price", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("selling_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("unit", sa.String(length=50), nullable=False),
        sa.Column("stock_quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("low_stock_threshold", sa.Integer(), server_default="5", nullable=False),
        sa.Column("image_path", sa.String(length=1024), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["pos_categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("barcode", "company_id", name="uq_pos_products_barcode_company"),
        sa.UniqueConstraint("sku", "company_id", name="uq_pos_products_sku_company"),
    )
    op.create_index("ix_pos_products_company_id", "pos_products", ["company_id"])
    op.create_index("ix_pos_products_category_id", "pos_products", ["category_id"])
    op.create_index("ix_pos_products_created_by_id", "pos_products", ["created_by_id"])

    # pos_product_variants
    op.create_table(
        "pos_product_variants",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=True),
        sa.Column("barcode", sa.String(length=100), nullable=True),
        sa.Column("selling_price", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("stock_quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("low_stock_threshold", sa.Integer(), server_default="5", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["pos_products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("barcode", "company_id", name="uq_pos_variants_barcode_company"),
        sa.UniqueConstraint("sku", "company_id", name="uq_pos_variants_sku_company"),
    )
    op.create_index("ix_pos_product_variants_product_id", "pos_product_variants", ["product_id"])
    op.create_index("ix_pos_product_variants_company_id", "pos_product_variants", ["company_id"])

    # pos_stock_movements
    op.create_table(
        "pos_stock_movements",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=True),
        sa.Column("variant_id", sa.Uuid(), nullable=True),
        sa.Column("movement_type", sa.String(length=20), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("reference_type", sa.String(length=50), nullable=True),
        sa.Column("reference_id", sa.String(length=36), nullable=True),
        sa.Column("notes", sa.String(length=512), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["pos_products.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["variant_id"], ["pos_product_variants.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_stock_movements_company_id", "pos_stock_movements", ["company_id"])
    op.create_index("ix_pos_stock_movements_product_id", "pos_stock_movements", ["product_id"])
    op.create_index("ix_pos_stock_movements_variant_id", "pos_stock_movements", ["variant_id"])

    # pos_transactions
    op.create_table(
        "pos_transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("transaction_number", sa.String(length=50), nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("discount", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("tax_amount", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("grand_total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("payment_method", sa.String(length=50), nullable=False),
        sa.Column("payment_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="completed", nullable=False),
        sa.Column("notes", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("transaction_number", "company_id", name="uq_pos_transactions_number_company"),
    )
    op.create_index("ix_pos_transactions_company_id", "pos_transactions", ["company_id"])
    op.create_index("ix_pos_transactions_created_by_id", "pos_transactions", ["created_by_id"])

    # pos_transaction_items
    op.create_table(
        "pos_transaction_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("transaction_id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("variant_id", sa.Uuid(), nullable=True),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("barcode", sa.String(length=100), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("discount", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("tax_amount", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("line_total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["transaction_id"], ["pos_transactions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["pos_products.id"]),
        sa.ForeignKeyConstraint(["variant_id"], ["pos_product_variants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_transaction_items_transaction_id", "pos_transaction_items", ["transaction_id"])
    op.create_index("ix_pos_transaction_items_company_id", "pos_transaction_items", ["company_id"])

    # pos_payments
    op.create_table(
        "pos_payments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("transaction_id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("payment_method", sa.String(length=50), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["transaction_id"], ["pos_transactions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_payments_transaction_id", "pos_payments", ["transaction_id"])

    # pos_returns
    op.create_table(
        "pos_returns",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("transaction_id", sa.Uuid(), nullable=False),
        sa.Column("reason", sa.String(length=512), nullable=True),
        sa.Column("refund_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("refund_method", sa.String(length=50), nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["transaction_id"], ["pos_transactions.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_returns_company_id", "pos_returns", ["company_id"])
    op.create_index("ix_pos_returns_transaction_id", "pos_returns", ["transaction_id"])

    # pos_return_items
    op.create_table(
        "pos_return_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("return_id", sa.Uuid(), nullable=False),
        sa.Column("transaction_item_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("variant_id", sa.Uuid(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("refund_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["return_id"], ["pos_returns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["transaction_item_id"], ["pos_transaction_items.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["pos_products.id"]),
        sa.ForeignKeyConstraint(["variant_id"], ["pos_product_variants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_return_items_return_id", "pos_return_items", ["return_id"])


def downgrade() -> None:
    """Drop all POS tables."""
    op.drop_table("pos_return_items")
    op.drop_table("pos_returns")
    op.drop_table("pos_payments")
    op.drop_table("pos_transaction_items")
    op.drop_table("pos_transactions")
    op.drop_table("pos_stock_movements")
    op.drop_table("pos_product_variants")
    op.drop_table("pos_products")
    op.drop_table("pos_categories")
