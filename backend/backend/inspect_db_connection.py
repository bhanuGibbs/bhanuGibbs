import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import get_settings

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False)

async def main():
    try:
        async with engine.begin() as conn:
            current_db = (await conn.execute(text("select current_database()"))).scalar()
            user_count = (await conn.execute(text("select count(*) from information_schema.columns where table_name='users'"))).scalar()
            Path('db_probe.txt').write_text(f'{current_db}\n{user_count}', encoding='utf-8')
    except Exception as exc:
        Path('db_probe_error.txt').write_text(str(exc), encoding='utf-8')

asyncio.run(main())
