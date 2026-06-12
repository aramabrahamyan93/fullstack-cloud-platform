export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "unknown_error") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export function getErrorCode(error: unknown): string | null {
  if (error instanceof ApiError) {
    return error.code;
  }

  return null;
}

export async function parseApiErrorResponse(
  response: Response
): Promise<ApiError> {
  let body: ApiErrorResponse | null = null;

  try {
    body = (await response.json()) as ApiErrorResponse;
  } catch {
    body = null;
  }

  return new ApiError(
    body?.error?.message ?? "Request failed.",
    response.status,
    body?.error?.code ?? "unknown_error"
  );
}

export async function createApiError(response: Response): Promise<ApiError> {
  return parseApiErrorResponse(response);
}
