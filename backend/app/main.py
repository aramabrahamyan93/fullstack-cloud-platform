import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.tasks import router as tasks_router
from app.api.version import router as version_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.init_db import init_db


configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application")
    logger.info("Initializing database")

    init_db()

    logger.info("Database initialization completed")

    yield

    logger.info("Stopping application")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(version_router)
app.include_router(tasks_router)