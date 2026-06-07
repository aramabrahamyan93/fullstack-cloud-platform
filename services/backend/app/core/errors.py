from http import HTTPStatus


class AppError(Exception):
    status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR
    error_code: str = "application_error"
    message: str = "Application error."

    def __init__(
        self,
        message: str | None = None,
        *,
        error_code: str | None = None,
        status_code: int | None = None,
    ):
        self.message = message or self.message
        self.error_code = error_code or self.error_code
        self.status_code = status_code or self.status_code

        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = HTTPStatus.NOT_FOUND
    error_code = "not_found"
    message = "Resource was not found."


class BadRequestError(AppError):
    status_code = HTTPStatus.BAD_REQUEST
    error_code = "bad_request"
    message = "Bad request."


class ConflictError(AppError):
    status_code = HTTPStatus.CONFLICT
    error_code = "conflict"
    message = "Resource conflict."