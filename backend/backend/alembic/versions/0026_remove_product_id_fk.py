"""remove product_id fk from pos_transaction_items

Revision ID: 0026_remove_product_id_fk
Revises: 0025_add_central_product_repository
Create Date: 2026-11-17 00:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0026'
down_revision: Union[str, None] = '0025'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the foreign key constraint on product_id
    op.drop_constraint('pos_transaction_items_product_id_fkey', 'pos_transaction_items', type_='foreignkey')
    # Change product_id column to VARCHAR(36) without FK
    op.alter_column('pos_transaction_items', 'product_id',
               existing_type=sa.UUID(),
               type_=sa.String(36),
               existing_nullable=False)


def downgrade() -> None:
    # Restore the foreign key constraint
    op.alter_column('pos_transaction_items', 'product_id',
               existing_type=sa.String(36),
               type_=sa.UUID(),
               existing_nullable=False)
    op.create_foreign_key('pos_transaction_items_product_id_fkey', 'pos_transaction_items', 'pos_products', ['product_id'], ['id'])
