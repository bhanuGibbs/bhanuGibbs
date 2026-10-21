from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("companies") as batch_op:
        if op.get_bind().dialect.name != "sqlite":
            batch_op.drop_constraint("companies_name_key", type_="unique")
        for name, type_, nullable, default in (
            ("gstin", sa.String(20), True, None),
            ("country", sa.String(100), True, None),
            ("state", sa.String(100), True, None),
            ("city", sa.String(100), True, None),
            ("pincode", sa.String(20), True, None),
            ("currency", sa.String(10), True, "INR"),
            ("default_terms", sa.String(2048), True, None),
            ("quotation_prefix", sa.String(50), False, "QT"),
            ("default_validity_days", sa.Integer(), True, "30"),
            ("logo_path", sa.String(1024), True, None),
            ("signature_path", sa.String(1024), True, None),
        ):
            batch_op.add_column(sa.Column(name, type_, nullable=nullable, server_default=default))

    with op.batch_alter_table("customers") as batch_op:
        batch_op.add_column(sa.Column("company_id", pg.UUID(as_uuid=True), nullable=True))
        batch_op.create_foreign_key("fk_customers_company_id_companies", "companies", ["company_id"], ["id"])
        for name, size in (("gstin", 20), ("country", 100), ("state", 100), ("city", 100), ("pincode", 20)):
            batch_op.add_column(sa.Column(name, sa.String(size), nullable=True))

    with op.batch_alter_table("products") as batch_op:
        batch_op.add_column(sa.Column("company_id", pg.UUID(as_uuid=True), nullable=True))
        batch_op.create_foreign_key("fk_products_company_id_companies", "companies", ["company_id"], ["id"])
        batch_op.add_column(sa.Column("hsn_code", sa.String(50), nullable=True))
        batch_op.add_column(sa.Column("gst_percentage", sa.Numeric(5, 2), nullable=True))
        batch_op.add_column(sa.Column("unit", sa.String(50), nullable=True))
        batch_op.add_column(sa.Column("status", sa.String(20), nullable=False, server_default="active"))

    with op.batch_alter_table("quotation_items") as batch_op:
        batch_op.add_column(sa.Column("item_name", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("description", sa.String(1024), nullable=True))
        batch_op.add_column(sa.Column("unit", sa.String(50), nullable=True))
        batch_op.add_column(sa.Column("discount", sa.Numeric(12, 2), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("tax_percentage", sa.Numeric(5, 2), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("tax_amount", sa.Numeric(14, 2), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("amount", sa.Numeric(14, 2), nullable=False, server_default="0"))

    with op.batch_alter_table("quotations") as batch_op:
        batch_op.add_column(sa.Column("quotation_number", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("quotation_year", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("subtotal", sa.Numeric(14, 2), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("discount", sa.Numeric(14, 2), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("tax_amount", sa.Numeric(14, 2), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("currency", sa.String(10), nullable=True))
        batch_op.add_column(sa.Column("status", sa.String(50), nullable=False, server_default="Draft"))
        batch_op.add_column(sa.Column("valid_until", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("notes", sa.String(2048), nullable=True))
        batch_op.add_column(sa.Column("terms", sa.String(2048), nullable=True))
        batch_op.add_column(sa.Column("company_name", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("company_address", sa.String(512), nullable=True))
        batch_op.add_column(sa.Column("company_phone_number", sa.String(50), nullable=True))
        batch_op.add_column(sa.Column("company_email", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("company_website", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("company_gstin", sa.String(20), nullable=True))
        batch_op.add_column(sa.Column("company_logo_path", sa.String(1024), nullable=True))
        batch_op.add_column(sa.Column("company_signature_path", sa.String(1024), nullable=True))
        batch_op.add_column(sa.Column("customer_name", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("customer_email", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("customer_phone_number", sa.String(50), nullable=True))
        batch_op.add_column(sa.Column("customer_address", sa.String(512), nullable=True))
        batch_op.add_column(sa.Column("customer_gstin", sa.String(20), nullable=True))
        batch_op.create_unique_constraint(
            "uq_quotations_company_quotation_number", ["company_id", "quotation_number"]
        )

    op.create_table(
        'quotation_sequences',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column('company_id', pg.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('prefix', sa.String(length=50), nullable=False),
        sa.Column('next_number', sa.Integer(), nullable=False, server_default='1'),
        sa.UniqueConstraint('company_id', 'year', name='uq_quotation_sequences_company_year'),
    )

    op.create_table(
        'auth_sessions',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column('user_id', pg.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('refresh_token', sa.String(length=1024), nullable=False, unique=True),
        sa.Column('token_id', sa.String(length=128), nullable=False, unique=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('auth_sessions')
    op.drop_table('quotation_sequences')
    op.drop_constraint('uq_quotations_company_quotation_number', 'quotations', type_='unique')
    op.drop_column('quotations', 'customer_gstin')
    op.drop_column('quotations', 'customer_address')
    op.drop_column('quotations', 'customer_phone_number')
    op.drop_column('quotations', 'customer_email')
    op.drop_column('quotations', 'customer_name')
    op.drop_column('quotations', 'company_signature_path')
    op.drop_column('quotations', 'company_logo_path')
    op.drop_column('quotations', 'company_gstin')
    op.drop_column('quotations', 'company_website')
    op.drop_column('quotations', 'company_email')
    op.drop_column('quotations', 'company_phone_number')
    op.drop_column('quotations', 'company_address')
    op.drop_column('quotations', 'company_name')
    op.drop_column('quotations', 'terms')
    op.drop_column('quotations', 'notes')
    op.drop_column('quotations', 'valid_until')
    op.drop_column('quotations', 'status')
    op.drop_column('quotations', 'currency')
    op.drop_column('quotations', 'tax_amount')
    op.drop_column('quotations', 'discount')
    op.drop_column('quotations', 'subtotal')
    op.drop_column('quotations', 'quotation_year')
    op.drop_column('quotations', 'quotation_number')
    op.drop_column('quotation_items', 'amount')
    op.drop_column('quotation_items', 'tax_amount')
    op.drop_column('quotation_items', 'tax_percentage')
    op.drop_column('quotation_items', 'discount')
    op.drop_column('quotation_items', 'unit')
    op.drop_column('quotation_items', 'description')
    op.drop_column('quotation_items', 'item_name')
    op.drop_column('products', 'status')
    op.drop_column('products', 'unit')
    op.drop_column('products', 'gst_percentage')
    op.drop_column('products', 'hsn_code')
    op.drop_column('products', 'company_id')
    op.drop_column('customers', 'pincode')
    op.drop_column('customers', 'city')
    op.drop_column('customers', 'state')
    op.drop_column('customers', 'country')
    op.drop_column('customers', 'gstin')
    op.drop_column('customers', 'company_id')
    op.drop_column('companies', 'signature_path')
    op.drop_column('companies', 'logo_path')
    op.drop_column('companies', 'default_validity_days')
    op.drop_column('companies', 'quotation_prefix')
    op.drop_column('companies', 'default_terms')
    op.drop_column('companies', 'currency')
    op.drop_column('companies', 'pincode')
    op.drop_column('companies', 'city')
    op.drop_column('companies', 'state')
    op.drop_column('companies', 'country')
    op.drop_column('companies', 'gstin')
    op.create_unique_constraint('companies_name_key', 'companies', ['name'])
