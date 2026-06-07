import logging
import sys

from app.middleware.request_context import get_request_id


class RequestIdLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "-"
        return True


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(RequestIdLogFilter())

    logging.basicConfig(
        level=logging.INFO,
        format=(
            "%(asctime)s | %(levelname)s | %(name)s | "
            "request_id=%(request_id)s | %(message)s"
        ),
        handlers=[
            handler,
        ],
        force=True,
    )