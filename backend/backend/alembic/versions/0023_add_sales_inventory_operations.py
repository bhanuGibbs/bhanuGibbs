"""Add organization-scoped Sales & Inventory operations."""

from alembic import op
import sqlalchemy as sa


revision = "0023"
down_revision = "0022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sales_inventory_dealers",
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("dealer_code", sa.String(length=50), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("contact_name", sa.String(length=255), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone_number", sa.String(length=50), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("gstin", sa.String(length=20), nullable=True),
        sa.Column("territory", sa.String(length=120), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "dealer_code", name="uq_si_dealer_company_code"),
    )
    op.create_index("ix_sales_inventory_dealers_company_id", "sales_inventory_dealers", ["company_id"])

    op.create_table(
        "sales_inventory_products",
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("product_code", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("unit", sa.String(length=50), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("reorder_level", sa.Numeric(12, 3), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint("unit_price >= 0", name="ck_si_product_price_nonnegative"),
        sa.CheckConstraint("reorder_level >= 0", name="ck_si_product_reorder_nonnegative"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "product_code", name="uq_si_product_company_code"),
    )
    op.create_index("ix_sales_inventory_products_company_id", "sales_inventory_products", ["company_id"])

    op.create_table(
        "sales_inventory_orders",
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("dealer_id", sa.Uuid(), nullable=False),
        sa.Column("sales_rep_id", sa.Uuid(), nullable=False),
        sa.Column("order_number", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("approved_by_id", sa.Uuid(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "status IN ('Draft', 'Pending Approval', 'Approved', 'Rejected', 'Processing', 'Dispatched', 'Delivered', 'Cancelled')",
            name="ck_si_order_status",
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["dealer_id"], ["sales_inventory_dealers.id"]),
        sa.ForeignKeyConstraint(["sales_rep_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["approved_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "order_number", name="uq_si_order_company_number"),
    )
    op.create_index("ix_sales_inventory_orders_company_id", "sales_inventory_orders", ["company_id"])

    op.create_table(
        "sales_inventory_order_items",
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("product_code", sa.String(length=100), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("unit", sa.String(length=50), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 3), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("line_total", sa.Numeric(14, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint("quantity > 0", name="ck_si_order_item_quantity_positive"),
        sa.CheckConstraint("unit_price >= 0", name="ck_si_order_item_price_nonnegative"),
        sa.ForeignKeyConstraint(["order_id"], ["sales_inventory_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["sales_inventory_products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sales_inventory_order_items_order_id", "sales_inventory_order_items", ["order_id"])

    op.create_table(
        "sales_inventory_order_history",
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("actor_id", sa.Uuid(), nullable=True),
        sa.Column("from_status", sa.String(length=30), nullable=True),
        sa.Column("to_status", sa.String(length=30), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["sales_inventory_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sales_inventory_order_history_order_id", "sales_inventory_order_history", ["order_id"])

    op.create_table(
        "sales_inventory_invoices",
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("invoice_number", sa.String(length=50), nullable=False),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["sales_inventory_orders.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "invoice_number", name="uq_si_invoice_company_number"),
        sa.UniqueConstraint("order_id", name="uq_si_invoice_order"),
    )
    op.create_index("ix_sales_inventory_invoices_company_id", "sales_inventory_invoices", ["company_id"])

    op.create_table(
        "sales_inventory_stock",
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("quantity", sa.Numeric(14, 3), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint("quantity >= 0", name="ck_si_stock_quantity_nonnegative"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["sales_inventory_products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "product_id", name="uq_si_stock_company_product"),
    )
    op.create_index("ix_sales_inventory_stock_company_id", "sales_inventory_stock", ["company_id"])

    op.create_table(
        "sales_inventory_transactions",
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("order_id", sa.Uuid(), nullable=True),
        sa.Column("actor_id", sa.Uuid(), nullable=True),
        sa.Column("transaction_type", sa.String(length=30), nullable=False),
        sa.Column("quantity_delta", sa.Numeric(14, 3), nullable=False),
        sa.Column("balance_after", sa.Numeric(14, 3), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "transaction_type IN ('Purchase', 'Order Approval', 'Manual Adjustment', 'Return')",
            name="ck_si_transaction_type",
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["sales_inventory_products.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["sales_inventory_orders.id"]),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sales_inventory_transactions_company_id", "sales_inventory_transactions", ["company_id"])
    op.create_index("ix_sales_inventory_transactions_product_id", "sales_inventory_transactions", ["product_id"])

    op.create_table(
        "sales_inventory_notifications",
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=False),
        sa.Column("resource_id", sa.Uuid(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sales_inventory_notifications_company_id", "sales_inventory_notifications", ["company_id"])
    op.create_index("ix_sales_inventory_notifications_user_id", "sales_inventory_notifications", ["user_id"])


def downgrade() -> None:
    for table in (
        "sales_inventory_notifications",
        "sales_inventory_transactions",
        "sales_inventory_stock",
        "sales_inventory_order_history",
        "sales_inventory_invoices",
        "sales_inventory_order_items",
        "sales_inventory_orders",
        "sales_inventory_products",
        "sales_inventory_dealers",
    ):
        op.drop_table(table)
