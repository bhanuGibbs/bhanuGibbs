from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

revision = '0003_add_user_profile_fields'
down_revision = '0002_add_domain_models'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('company_id', pg.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=True))
    op.add_column('users', sa.Column('is_profile_complete', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade() -> None:
    op.drop_column('users', 'is_profile_complete')
    op.drop_column('users', 'company_id')
