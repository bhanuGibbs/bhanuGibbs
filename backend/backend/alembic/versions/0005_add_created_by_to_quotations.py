from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

revision = '0005'
down_revision = '0004_merge_heads'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'quotations',
        sa.Column('created_by_id', pg.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        'fk_quotations_created_by_id_users',
        'quotations',
        'users',
        ['created_by_id'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_quotations_created_by_id_users', 'quotations', type_='foreignkey')
    op.drop_column('quotations', 'created_by_id')
