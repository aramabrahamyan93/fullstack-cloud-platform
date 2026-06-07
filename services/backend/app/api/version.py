from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(
    prefix="/version",
    tags=["version"],
)


@router.get("")
def version():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
    }