from contextvars import ContextVar
from contextvars import Token
from uuid import uuid4

REQUEST_ID_HEADER = "X-Request-ID"

_request_id_context: ContextVar[str | None] = ContextVar(
    "request_id",
    default=None,
)


def create_request_id() -> str:
    return uuid4().hex


def get_request_id() -> str | None:
    return _request_id_context.get()


def set_request_id(request_id: str) -> Token[str | None]:
    return _request_id_context.set(request_id)


def reset_request_id(token: Token[str | None]) -> None:
    _request_id_context.reset(token)