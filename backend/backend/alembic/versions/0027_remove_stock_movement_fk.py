"""remove product_id fk from pos_stock_movements

Revision ID: 0027_remove_stock_movement_fk
Revises: 0026_remove_product_id_fk
Create Date: 2026-11-17 00:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0027'
down_revision: Union[str, None] = '0026'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the foreign key constraint on product_id
    op.drop_constraint('pos_stock_movements_product_id_fkey', 'pos_stock_movements', type_='foreignkey')
    # Change product_id column to VARCHAR(36) without FK
    op.alter_column('pos_stock_movements', 'product_id',
               existing_type=sa.UUID(),
               type_=sa.String(36),
               existing_nullable=True)


def downgrade() -> None:
    # Restore the foreign key constraint
    op.alter_column('pos_stock_movements', 'product_id',
               existing_type=sa.String(36),
               type_=sa.UUID(),
               existing_nullable=True)
    op.create_foreign_key('pos_stock_movements_product_id_fkey', 'pos_stock_movements', 'pos_products', ['product_id'], ['id'], ondelete='SET NULL')
