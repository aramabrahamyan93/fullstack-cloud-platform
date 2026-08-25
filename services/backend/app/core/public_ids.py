import secrets

PUBLIC_ID_SEPARATOR = "_"
PUBLIC_ID_RANDOM_TOKEN_LENGTH = 16
WORKSPACE_PUBLIC_ID_PREFIX = "ws"


def generate_public_id(prefix: str) -> str:
    token = secrets.token_urlsafe(PUBLIC_ID_RANDOM_TOKEN_LENGTH)
    normalized_token = token.replace("-", "").replace("_", "")

    return f"{prefix}{PUBLIC_ID_SEPARATOR}{normalized_token}"


def generate_workspace_public_id() -> str:
    return generate_public_id(WORKSPACE_PUBLIC_ID_PREFIX)
