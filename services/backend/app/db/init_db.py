import logging
import time

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.database import engine
from app.db.migrations import run_database_migrations

logger = logging.getLogger(__name__)


def init_db() -> None:
    """
    Initialize the database connection and run schema migrations.

    Runtime schema ownership belongs to Alembic migrations. SQLAlchemy
    create_all() remains available only for isolated test fixtures.
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

            logger.info("Database connection is ready.")

            if settings.db_run_migrations_on_startup:
                logger.info("Running database migrations.")
                run_database_migrations()
                logger.info("Database migrations completed successfully.")
            else:
                logger.info("Database migrations skipped by configuration.")

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
