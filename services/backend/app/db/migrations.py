import logging
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.db.database import engine

logger = logging.getLogger(__name__)

APPLICATION_TABLES = {
    "users",
    "organizations",
    "organization_members",
    "organization_invitations",
    "organization_audit_logs",
    "tasks",
}

ALEMBIC_VERSION_TABLE = "alembic_version"


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def get_alembic_config() -> Config:
    backend_root = _backend_root()
    config = Config(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", str(backend_root / "migrations"))
    return config


def _has_existing_unversioned_application_schema() -> bool:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    has_application_tables = APPLICATION_TABLES.issubset(table_names)
    has_alembic_version = ALEMBIC_VERSION_TABLE in table_names

    return has_application_tables and not has_alembic_version


def stamp_existing_schema_as_current() -> None:
    config = get_alembic_config()
    command.stamp(config, "head")


def run_database_migrations() -> None:
    config = get_alembic_config()

    if _has_existing_unversioned_application_schema():
        logger.info(
            "Existing application tables found without Alembic version table. "
            "Stamping the current schema as head."
        )
        command.stamp(config, "head")
        return

    command.upgrade(config, "head")
