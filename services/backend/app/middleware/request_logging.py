import logging
from time import perf_counter
from typing import Iterable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from app.middleware.request_context import REQUEST_ID_HEADER
from app.middleware.request_context import create_request_id
from app.middleware.request_context import reset_request_id
from app.middleware.request_context import set_request_id

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        *,
        request_id_header: str = REQUEST_ID_HEADER,
        excluded_paths: Iterable[str] | None = None,
    ):
        super().__init__(app)
        self.request_id_header = request_id_header
        self.excluded_paths = set(excluded_paths or [])

    async def dispatch(
        self,
        request: Request,
        call_next,
    ) -> Response:
        request_id = request.headers.get(self.request_id_header) or create_request_id()
        token = set_request_id(request_id)
        start_time = perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = self._get_duration_ms(start_time)

            logger.exception(
                "Request failed method=%s path=%s duration_ms=%s request_id=%s",
                request.method,
                request.url.path,
                duration_ms,
                request_id,
            )

            raise
        finally:
            reset_request_id(token)

        response.headers[self.request_id_header] = request_id

        if request.url.path not in self.excluded_paths:
            duration_ms = self._get_duration_ms(start_time)

            logger.info(
                "Request completed method=%s path=%s status_code=%s duration_ms=%s request_id=%s",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
                request_id,
            )

        return response

    @staticmethod
    def _get_duration_ms(start_time: float) -> int:
        return int((perf_counter() - start_time) * 1000)