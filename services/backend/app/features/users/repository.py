from sqlalchemy import select
from sqlalchemy.orm import Session

from app.features.users.models import User


class UserRepository:
    def get_by_id(self, db: Session, user_id: int) -> User | None:
        statement = select(User).where(User.id == user_id)
        return db.scalars(statement).first()

    def get_by_email(self, db: Session, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return db.scalars(statement).first()

    def create(
        self,
        db: Session,
        *,
        email: str,
        hashed_password: str,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user


def get_user_by_email(db: Session, *, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return db.scalars(statement).first()


def get_user_by_id(db: Session, *, user_id: int) -> User | None:
    statement = select(User).where(User.id == user_id)
    return db.scalars(statement).first()


def create_user(
    db: Session,
    *,
    email: str,
    hashed_password: str,
) -> User:
    user = User(
        email=email,
        hashed_password=hashed_password,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user
