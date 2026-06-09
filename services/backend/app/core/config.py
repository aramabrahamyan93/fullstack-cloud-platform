from pydantic import model_validator
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


LOCAL_AUTH_SECRET_KEY = "local-dev-change-me"


class Settings(BaseSettings):
    app_env: str = "local"
    app_name: str = "platform-api"
    app_version: str = "0.1.0"

    database_url: str
    sql_echo: bool = False

    db_init_retries: int = 30
    db_init_retry_delay_seconds: float = 1.0

    auth_secret_key: str = LOCAL_AUTH_SECRET_KEY
    auth_algorithm: str = "HS256"
    auth_access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(
        env_file=".env.local",
    )

    @model_validator(mode="after")
    def validate_security_settings(self):
        normalized_env = self.app_env.lower()

        is_local_like_environment = (
            normalized_env == "test"
            or normalized_env == "local"
            or normalized_env.startswith("local-")
        )

        if (
            not is_local_like_environment
            and self.auth_secret_key == LOCAL_AUTH_SECRET_KEY
        ):
            raise ValueError(
                "auth_secret_key must be configured for non-local environments."
            )

        if self.auth_access_token_expire_minutes <= 0:
            raise ValueError("auth_access_token_expire_minutes must be positive.")

        return self


settings = Settings()