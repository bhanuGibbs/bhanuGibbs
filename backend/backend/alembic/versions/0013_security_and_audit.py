"""Hash authentication secrets and record financial-document audit history."""

from __future__ import annotations

import hashlib

from alembic import op
import sqlalchemy as sa


revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def upgrade() -> None:
    op.add_column("auth_sessions", sa.Column("refresh_token_hash", sa.String(length=64), nullable=True))
    connection = op.get_bind()
    sessions = sa.table(
        "auth_sessions",
        sa.column("id", sa.Uuid()),
        sa.column("refresh_token", sa.String()),
        sa.column("refresh_token_hash", sa.String()),
    )
    for row in connection.execute(sa.select(sessions.c.id, sessions.c.refresh_token)):
        connection.execute(
            sessions.update().where(sessions.c.id == row.id).values(refresh_token_hash=_sha256(row.refresh_token))
        )

    reset_tokens = sa.table(
        "users", sa.column("id", sa.Uuid()), sa.column("password_reset_token", sa.String())
    )
    for row in connection.execute(
        sa.select(reset_tokens.c.id, reset_tokens.c.password_reset_token).where(
            reset_tokens.c.password_reset_token.is_not(None)
        )
    ):
        connection.execute(
            reset_tokens.update()
            .where(reset_tokens.c.id == row.id)
            .values(password_reset_token=_sha256(row.password_reset_token))
        )

    with op.batch_alter_table("auth_sessions") as batch:
        batch.drop_column("refresh_token")
        batch.alter_column("refresh_token_hash", existing_type=sa.String(length=64), nullable=False)
        batch.create_unique_constraint("uq_auth_sessions_refresh_token_hash", ["refresh_token_hash"])
    op.create_index("ix_users_password_reset_token", "users", ["password_reset_token"])

    with op.batch_alter_table("quotations") as batch:
        batch.add_column(sa.Column("updated_by_id", sa.Uuid(), nullable=True))
        batch.create_foreign_key(
            "fk_quotations_updated_by_id_users", "users", ["updated_by_id"], ["id"]
        )
    op.create_table(
        "audit_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("resource_type", sa.String(length=50), nullable=False),
        sa.Column("resource_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("before_data", sa.JSON(), nullable=True),
        sa.Column("after_data", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_events_actor_user_id", "audit_events", ["actor_user_id"])
    op.create_index("ix_audit_events_resource_id", "audit_events", ["resource_id"])


def downgrade() -> None:
    # Raw token values cannot be reconstructed from the stored hashes. Revoke all
    # sessions during downgrade instead of putting hashes back into a JWT column.
    op.execute("DELETE FROM auth_sessions")
    op.drop_index("ix_audit_events_resource_id", table_name="audit_events")
    op.drop_index("ix_audit_events_actor_user_id", table_name="audit_events")
    op.drop_table("audit_events")
    with op.batch_alter_table("quotations") as batch:
        batch.drop_constraint("fk_quotations_updated_by_id_users", type_="foreignkey")
        batch.drop_column("updated_by_id")
    op.drop_index("ix_users_password_reset_token", table_name="users")
    with op.batch_alter_table("auth_sessions") as batch:
        batch.drop_constraint("uq_auth_sessions_refresh_token_hash", type_="unique")
        batch.drop_column("refresh_token_hash")
        batch.add_column(sa.Column("refresh_token", sa.String(length=1024), nullable=True))
        batch.alter_column("refresh_token", existing_type=sa.String(length=1024), nullable=False)
        batch.create_unique_constraint("uq_auth_sessions_refresh_token", ["refresh_token"])
