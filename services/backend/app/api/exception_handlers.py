import logging

from fastapi import FastAPI
from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.errors import AppError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)


async def app_error_handler(
    request: Request,
    exc: AppError,
) -> JSONResponse:
    logger.info(
        "Application error handled. path=%s status_code=%s error_code=%s message=%s",
        request.url.path,
        exc.status_code,
        exc.error_code,
        exc.message,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
            }
        },
    )