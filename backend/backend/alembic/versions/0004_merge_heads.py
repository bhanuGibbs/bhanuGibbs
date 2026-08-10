from alembic import op

revision = '0004_merge_heads'
down_revision = ('0003_add_user_auth_fields', '0003_add_user_profile_fields')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
