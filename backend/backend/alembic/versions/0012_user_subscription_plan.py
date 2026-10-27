from alembic import op
import sqlalchemy as sa


revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "subscription_plan",
            sa.String(length=20),
            server_default="free",
            nullable=False,
        ),
    )
    op.create_check_constraint(
        "ck_users_subscription_plan",
        "users",
        "subscription_plan IN ('free', 'basic', 'premium')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_users_subscription_plan", "users", type_="check")
    op.drop_column("users", "subscription_plan")
