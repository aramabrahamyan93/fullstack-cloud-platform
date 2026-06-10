from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.dependencies import get_auth_service
from app.db.dependencies import get_current_user
from app.db.dependencies import get_db
from app.features.users.models import User
from app.features.auth.schemas import LoginRequest
from app.features.auth.schemas import TokenResponse
from app.features.auth.schemas import UserCreate
from app.features.auth.schemas import UserRead
from app.features.auth.service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/register", response_model=UserRead, status_code=201)
def register(
    payload: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    return auth_service.register(db=db, payload=payload)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    return auth_service.login(db=db, payload=payload)


@router.get("/me", response_model=UserRead)
def me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user