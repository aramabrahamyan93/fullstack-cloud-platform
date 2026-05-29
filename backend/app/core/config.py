from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    app_name: str = "platform-api"
    app_version: str = "0.1.0"
    database_url: str

    model_config = SettingsConfigDict(
        env_file=".env.local",
    )


settings = Settings()