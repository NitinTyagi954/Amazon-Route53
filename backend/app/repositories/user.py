"""User Repository Data Access Layer."""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.user import User


class UserRepository:
    """Encapsulates data access logic for User entity."""

    @staticmethod
    def create(session: Session, email: str, hashed_password: str, full_name: Optional[str] = None) -> User:
        user = User(email=email, hashed_password=hashed_password, full_name=full_name)
        session.add(user)
        session.flush()
        return user

    @staticmethod
    def get_by_id(session: Session, user_id: str) -> Optional[User]:
        return session.get(User, user_id)

    @staticmethod
    def get_by_email(session: Session, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        return session.scalar(stmt)
