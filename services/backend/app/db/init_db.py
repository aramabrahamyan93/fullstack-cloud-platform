import logging
import time

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.database import Base
from app.db.database import engine

# Import models so SQLAlchemy registers them before create_all().
from app.features.tasks.models import Task  # noqa: F401
from app.features.users.models import User  # noqa: F401
from app.features.organizations.models import Organization, OrganizationAuditLog, OrganizationInvitation, OrganizationMember  # noqa: F401

logger = logging.getLogger(__name__)


def init_db() -> None:
    """
    Initialize database tables.

    Alembic migrations are intentionally postponed for now.
    For the current MVP/local workflow, SQLAlchemy create_all() is used.
    """
    max_attempts = settings.db_init_retries
    retry_delay_seconds = settings.db_init_retry_delay_seconds

    for attempt in range(1, max_attempts + 1):
        try:
            logger.info(
                "Checking database connection before initialization. attempt=%s/%s",
                attempt,
                max_attempts,
            )

            with engine.begin() as connection:
                connection.execute(text("SELECT 1"))

            logger.info("Database connection is ready. Creating tables if needed.")
            Base.metadata.create_all(bind=engine)
            logger.info("Database initialization completed successfully.")
            return

        except SQLAlchemyError:
            logger.exception(
                "Database initialization failed. attempt=%s/%s",
                attempt,
                max_attempts,
            )

            if attempt == max_attempts:
                logger.error("Database initialization failed after all retry attempts.")
                raise

            time.sleep(retry_delay_seconds)