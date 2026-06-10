from sqlalchemy.orm import Session

from app.core.errors import ConflictError
from app.core.errors import ForbiddenError
from app.core.errors import UnauthorizedError
from app.core.security import create_access_token
from app.core.security import hash_password
from app.core.security import verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest
from app.schemas.auth import TokenResponse
from app.schemas.auth import UserCreate


class AuthService:
    def __init__(self, user_repository: UserRepository | None = None):
        self.user_repository = user_repository or UserRepository()

    def register(self, db: Session, payload: UserCreate) -> User:
        existing_user = self.user_repository.get_by_email(db, str(payload.email))

        if existing_user:
            raise ConflictError("User with this email already exists.")

        return self.user_repository.create(
            db=db,
            email=str(payload.email),
            hashed_password=hash_password(payload.password),
        )

    def login(self, db: Session, payload: LoginRequest) -> TokenResponse:
        user = self.user_repository.get_by_email(db, str(payload.email))

        if not user or not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password.")

        if not user.is_active:
            raise ForbiddenError("User is inactive.")

        access_token = create_access_token(subject=str(user.id))

        return TokenResponse(access_token=access_token)

    def get_current_user(self, db: Session, user_id: int) -> User:
        user = self.user_repository.get_by_id(db, user_id)

        if not user:
            raise UnauthorizedError("Invalid authentication credentials.")

        if not user.is_active:
            raise ForbiddenError("User is inactive.")

        return user