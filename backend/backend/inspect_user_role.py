import asyncio
from app.core.database import get_session
from app.models.user import User
from app.models.role import Role
from sqlalchemy import select

async def main():
    async with get_session() as session:
        result = await session.execute(select(User).where(User.username == 'adminuser3'))
        user = result.scalars().first()
        print('USER', user.username if user else None, 'role_id', user.role_id if user else None, 'profile', user.is_profile_complete if user else None)
        if user and user.role_id:
            role = await session.get(Role, user.role_id)
            print('ROLE', role.name if role else None)

asyncio.run(main())
