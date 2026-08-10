from app.core.config import get_settings
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    settings = get_settings()
    print('DATABASE_URL=' + settings.database_url)
    engine = create_async_engine(settings.database_url, echo=False)
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text('SELECT 1'))
            print('DB_OK', result.scalar())
    finally:
        await engine.dispose()

asyncio.run(main())
