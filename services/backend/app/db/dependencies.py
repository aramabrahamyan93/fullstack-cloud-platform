from typing import Annotated

from fastapi import Depends
from fastapi import status
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.database import SessionLocal
from app.models.user import User
from app.services.auth_service import AuthService

try:
    from app.core.exceptions import AppError
except ImportError:
    AppError = None


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
        _raise_auth_error("Missing authentication token.")

    user_id = decode_access_token(credentials.credentials)

    if user_id is None:
        _raise_auth_error("Invalid authentication token.")

    return auth_service.get_current_user(db=db, user_id=int(user_id))


def _raise_auth_error(message: str) -> None:
    if AppError:
        raise AppError(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
        )

    from fastapi import HTTPException

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=message,
    )