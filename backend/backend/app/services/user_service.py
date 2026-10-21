from __future__ import annotations

import secrets
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.role_repository import RoleRepository
from app.security import get_password_hash, verify_password
from app.services.exceptions import BadRequestError, ConflictError, NotFoundError


class UserService:
    """Service layer for user business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = UserRepository(session)
        self.role_repository = RoleRepository(session)

    async def authenticate_user(self, username: str, password: str) -> User | None:
        """Authenticate a user by username and password."""
        user = await self.repository.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    async def create_user(
        self,
        username: str,
        email: str,
        password: str,
        role_name: str,
        mobile_number: str | None = None,
        is_superuser: bool = False,
    ) -> User:
        """Create a new user with a role assignment."""
        existing_user = await self.repository.get_by_username(username)
        if existing_user:
            raise ConflictError("Username already exists.")

        existing_email = await self.repository.get_by_email(email)
        if existing_email:
            raise ConflictError("Email already exists.")

        role = await self.role_repository.get_by_name(role_name)
        if not role:
            raise NotFoundError("Role does not exist.")

        hashed_password = get_password_hash(password)
        user = User(
            username=username,
            email=email,
            mobile_number=mobile_number,
            hashed_password=hashed_password,
            role_id=role.id,
            is_superuser=is_superuser,
        )
        await self.repository.add(user)
        await self.repository.commit()
        return user

    async def create_password_reset_token(self, email: str) -> str:
        """Generate a password reset token for the requested email."""
        user = await self.repository.get_by_email(email)
        if not user:
            raise NotFoundError("User not found.")

        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires_at = datetime.utcnow() + timedelta(hours=1)
        await self.repository.commit()
        return token

    async def reset_password(self, token: str, new_password: str) -> User:
        """Reset the user's password if the reset token is valid."""
        user = await self.repository.get_by_password_reset_token(token)
        if not user or not user.password_reset_expires_at:
            raise BadRequestError("Invalid or expired password reset token.")

        if datetime.utcnow() > user.password_reset_expires_at:
            raise BadRequestError("Invalid or expired password reset token.")

        user.hashed_password = get_password_hash(new_password)
        user.password_reset_token = None
        user.password_reset_expires_at = None
        await self.repository.commit()
        return user

    async def get_user_by_email(self, email: str) -> User | None:
        """Return a user by email."""
        return await self.repository.get_by_email(email)

    async def list_users(self) -> list[User]:
        """Return a list of all users."""
        return await self.repository.list_users()

    async def get_user_by_id(self, user_id: str) -> User | None:
        """Return a user by its UUID identifier."""
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            return None
        return await self.repository.get(user_uuid)

    async def update_profile(self, user_id: str, changes: dict[str, str | None]) -> User:
        """Update only the authenticated user's basic contact fields."""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise NotFoundError("User not found.")

        username = changes.get("username")
        if username is not None and username != user.username:
            existing = await self.repository.get_by_username(username)
            if existing and existing.id != user.id:
                raise ConflictError("Username already exists.")
            user.username = username

        email = changes.get("email")
        if email is not None and email != user.email:
            existing = await self.repository.get_by_email(email)
            if existing and existing.id != user.id:
                raise ConflictError("Email already exists.")
            user.email = email

        if "mobile_number" in changes:
            user.mobile_number = changes["mobile_number"]

        await self.repository.commit()
        return user
