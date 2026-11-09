"""Allow separate Sales & Inventory organizations to share a name."""

from alembic import op
import sqlalchemy as sa


revision = "0022"
down_revision = "0021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    name_constraints = [
        constraint
        for constraint in sa.inspect(bind).get_unique_constraints("companies")
        if constraint["column_names"] == ["name"]
    ]
    sqlite_name_unique = False
    if bind.dialect.name == "sqlite":
        for _, index_name, unique, *_ in bind.exec_driver_sql(
            "PRAGMA index_list(companies)"
        ):
            if unique:
                escaped_name = index_name.replace('"', '""')
                columns = bind.exec_driver_sql(
                    f'PRAGMA index_info("{escaped_name}")'
                ).all()
                if [column[2] for column in columns] == ["name"]:
                    sqlite_name_unique = True
                    break

    if bind.dialect.name == "sqlite" and (name_constraints or sqlite_name_unique):
        companies = sa.Table("companies", sa.MetaData(), autoload_with=bind)
        for constraint in list(companies.constraints):
            if (
                isinstance(constraint, sa.UniqueConstraint)
                and [column.name for column in constraint.columns] == ["name"]
            ):
                companies.constraints.remove(constraint)
        for index in list(companies.indexes):
            if index.unique and [column.name for column in index.columns] == ["name"]:
                companies.indexes.remove(index)
        with op.batch_alter_table(
            "companies", copy_from=companies, recreate="always"
        ) as batch_op:
            batch_op.alter_column(
                "name",
                existing_type=sa.String(length=255),
                nullable=False,
            )
    elif name_constraints:
        with op.batch_alter_table("companies") as batch_op:
            for constraint in name_constraints:
                batch_op.drop_constraint(constraint["name"], type_="unique")

    op.create_index(
        "companies_name_legacy_profiles_key",
        "companies",
        ["name"],
        unique=True,
        postgresql_where=sa.text("business_profile != 'sales_inventory'"),
        sqlite_where=sa.text("business_profile != 'sales_inventory'"),
    )


def downgrade() -> None:
    duplicate = op.get_bind().execute(
        sa.text(
            "SELECT name FROM companies GROUP BY name HAVING COUNT(*) > 1 LIMIT 1"
        )
    ).first()
    if duplicate:
        raise RuntimeError(
            "Cannot restore globally unique company names while duplicate organization names exist."
        )
    op.drop_index("companies_name_legacy_profiles_key", table_name="companies")
    if op.get_bind().dialect.name == "sqlite":
        with op.batch_alter_table("companies", recreate="always") as batch_op:
            batch_op.create_unique_constraint("companies_name_key", ["name"])
    else:
        op.create_unique_constraint("companies_name_key", "companies", ["name"])
