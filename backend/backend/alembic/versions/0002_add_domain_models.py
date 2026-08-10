from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

revision = "0002_add_domain_models"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False, unique=True),
        sa.Column("address", sa.String(length=512), nullable=True),
        sa.Column("phone_number", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("website", sa.String(length=255), nullable=True),
    )
    op.create_table(
        "customers",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone_number", sa.String(length=50), nullable=True),
        sa.Column("address", sa.String(length=512), nullable=True),
        sa.Column("company_name", sa.String(length=255), nullable=True),
    )
    op.create_table(
        "products",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1024), nullable=True),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=True, unique=True),
    )
    op.create_table(
        "quotations",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("reference_number", sa.String(length=100), nullable=False, unique=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1024), nullable=True),
        sa.Column("customer_id", pg.UUID(as_uuid=True), sa.ForeignKey("customers.id"), nullable=False),
        sa.Column("company_id", pg.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False, server_default=sa.text("0.00")),
        sa.Column("issued_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "quotation_items",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("quotation_id", pg.UUID(as_uuid=True), sa.ForeignKey("quotations.id"), nullable=False),
        sa.Column("product_id", pg.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_price", sa.Numeric(14, 2), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("quotation_items")
    op.drop_table("quotations")
    op.drop_table("products")
    op.drop_table("customers")
    op.drop_table("companies")
