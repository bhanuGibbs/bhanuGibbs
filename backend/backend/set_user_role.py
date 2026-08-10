import asyncio
import sys
from app.core.database import get_session
from app.models.user import User
from app.models.role import Role
from sqlalchemy import select

async def main() -> None:
    role_name = sys.argv[1] if len(sys.argv) > 1 else 'Manager'
    async with get_session() as session:
        user_result = await session.execute(select(User).where(User.username == 'adminuser3'))
        user = user_result.scalars().first()
        if not user:
            print('USER_NOT_FOUND')
            return
        role_result = await session.execute(select(Role).where(Role.name == role_name))
        role = role_result.scalars().first()
        if not role:
            print('ROLE_NOT_FOUND', role_name)
            return
        user.role_id = role.id
        await session.commit()
        print('UPDATED', user.username, '->', role.name)

asyncio.run(main())
