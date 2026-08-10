import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import get_settings

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False)

async def main() -> None:
    async with engine.connect() as conn:
        tables = await conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"))
        print('TABLES:')
        for row in tables:
            print(row[0])

        user_columns = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"))
        print('USERS_COLUMNS:')
        for row in user_columns:
            print(row[0])

        alembic_exists = await conn.execute(text("SELECT * FROM information_schema.tables WHERE table_schema='public' AND table_name='alembic_version'"))
        print('ALEMBIC_VERSION_EXISTS', alembic_exists.first() is not None)

if __name__ == '__main__':
    asyncio.run(main())
