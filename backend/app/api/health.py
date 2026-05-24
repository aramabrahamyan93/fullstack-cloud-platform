from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(
    prefix="/health",
    tags=["health"],
)


@router.get("")
def health():
    return {
        "status": "ok",
        "environment": settings.app_env,
    }