import logging

from fastapi import APIRouter
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.database import engine

logger = logging.getLogger(__name__)

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


@router.get("/live")
def liveness():
    return {
        "status": "ok",
    }


@router.get("/ready")
def readiness():
    try:
        with engine.begin() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ready",
            "database": "ok",
        }

    except SQLAlchemyError as exc:
        logger.exception("Readiness check failed because database is not available")

        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "database": "unavailable",
            },
        ) from exc