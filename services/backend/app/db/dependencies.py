from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import UnauthorizedError
from app.core.security import decode_access_token
from app.db.database import SessionLocal
from app.features.users.models import User
from app.features.auth.service import AuthService

bearer_scheme = HTTPBearer(auto_error=False)


def get_db():
    db: Session = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_auth_service() -> AuthService:
    return AuthService()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    if credentials is None:
        raise UnauthorizedError("Missing authentication token.")

    user_id = decode_access_token(credentials.credentials)

    if user_id is None:
        raise UnauthorizedError("Invalid authentication token.")

    try:
        parsed_user_id = int(user_id)
    except ValueError as exc:
        raise UnauthorizedError("Invalid authentication token.") from exc

    return auth_service.get_current_user(db=db, user_id=parsed_user_id)