import asyncio
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import inspect
from app.core.config import get_settings

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False)

async def main():
    async with engine.begin() as conn:
        insp = await conn.run_sync(lambda sync_conn: inspect(sync_conn))
        cols = insp.get_columns('users')
        out = '\n'.join(c['name'] for c in cols)
        Path('db_columns.txt').write_text(out, encoding='utf-8')

asyncio.run(main())
