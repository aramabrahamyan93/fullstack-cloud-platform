import { REQUEST_ID_HEADER } from "./requestId";

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
  };
  detail?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor({
    status,
    code,
    message,
    requestId,
    details
  }: {
    status: number;
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.requestId) {
      return `${error.message} (request id: ${error.requestId})`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}

export async function createApiError(response: Response): Promise<ApiError> {
  const responseText = await response.text();
  const responseRequestId = response.headers.get(REQUEST_ID_HEADER) || undefined;

  if (!responseText) {
    return new ApiError({
      status: response.status,
      code: "http_error",
      message: `Request failed with status ${response.status}`,
      requestId: responseRequestId
    });
  }

  try {
    const body = JSON.parse(responseText) as ApiErrorBody;
    const code = body.error?.code || "http_error";
    const message =
      body.error?.message ||
      body.detail ||
      `Request failed with status ${response.status}`;
    const requestId = body.error?.requestId || responseRequestId;

    return new ApiError({
      status: response.status,
      code,
      message,
      requestId,
      details: body
    });
  } catch {
    return new ApiError({
      status: response.status,
      code: "http_error",
      message: responseText,
      requestId: responseRequestId
    });
  }
}