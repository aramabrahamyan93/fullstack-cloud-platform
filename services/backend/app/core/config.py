from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    app_name: str = "platform-api"
    app_version: str = "0.1.0"

    database_url: str
    sql_echo: bool = False

    db_init_retries: int = 30
    db_init_retry_delay_seconds: float = 1.0

    model_config = SettingsConfigDict(
        env_file=".env.local",
    )


settings = Settings()