import asyncio
from app.core.database import get_session
from app.models.user import User
from app.models.role import Role
from sqlalchemy import select

async def main():
    async with get_session() as session:
        user_result = await session.execute(select(User).where(User.username == 'adminuser3'))
        user = user_result.scalars().first()
        if not user:
            print('USER_NOT_FOUND')
            return
        role_result = await session.execute(select(Role).where(Role.name == 'Sales'))
        role = role_result.scalars().first()
        if not role:
            print('ROLE_NOT_FOUND')
            return
        user.role_id = role.id
        await session.commit()
        print('UPDATED', user.username, '->', role.name)

asyncio.run(main())
