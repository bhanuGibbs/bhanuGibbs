"""Add payments table for Razorpay payment integration."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create the payments table for Razorpay integration."""

    op.create_table(
        "payments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=True),
        sa.Column("razorpay_order_id", sa.String(length=255), nullable=False),
        sa.Column("razorpay_payment_id", sa.String(length=255), nullable=True),
        sa.Column("amount", sa.Integer(), nullable=False, comment="Amount in smallest currency unit (e.g., paise)"),
        sa.Column("currency", sa.String(length=10), server_default="INR", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="created", nullable=False),
        sa.Column("customer_name", sa.String(length=255), nullable=True),
        sa.Column("customer_email", sa.String(length=255), nullable=True),
        sa.Column("razorpay_signature", sa.String(length=512), nullable=True),
        sa.Column("verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("description", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="SET NULL"),
        sa.CheckConstraint(
            "status IN ('created', 'paid', 'failed', 'refunded', 'pending')",
            name="ck_payments_status",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("razorpay_order_id", name="uq_payments_razorpay_order_id"),
    )
    op.create_index("ix_payments_user_id", "payments", ["user_id"])
    op.create_index("ix_payments_razorpay_order_id", "payments", ["razorpay_order_id"])
    op.create_index("ix_payments_razorpay_payment_id", "payments", ["razorpay_payment_id"])
    op.create_index("ix_payments_status", "payments", ["status"])
    op.create_index("ix_payments_company_id", "payments", ["company_id"])


def downgrade() -> None:
    """Drop the payments table."""
    op.drop_index("ix_payments_company_id", table_name="payments")
    op.drop_index("ix_payments_status", table_name="payments")
    op.drop_index("ix_payments_razorpay_payment_id", table_name="payments")
    op.drop_index("ix_payments_razorpay_order_id", table_name="payments")
    op.drop_index("ix_payments_user_id", table_name="payments")
    op.drop_table("payments")
