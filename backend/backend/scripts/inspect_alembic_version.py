from app.core.config import get_settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import asyncio

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name='alembic_version'"))
        print('columns:')
        for row in result.fetchall():
            print(row)
        result2 = await conn.execute(text("SELECT version_num FROM alembic_version"))
        print('versions:')
        for row in result2.fetchall():
            print(row[0])
    await engine.dispose()

asyncio.run(main())
