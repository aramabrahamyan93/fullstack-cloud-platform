from fastapi import status


class AppError(Exception):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = "internal_error"

    def __init__(
        self,
        message: str,
        error_code: str | None = None,
    ):
        self.message = message
        self.error_code = error_code or self.error_code
        super().__init__(message)


class BadRequestError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "bad_request"


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "unauthorized"


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "forbidden"


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    error_code = "conflict"
