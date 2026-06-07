export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
  detail?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor({
    status,
    code,
    message,
    details
  }: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}

export async function createApiError(response: Response): Promise<ApiError> {
  const responseText = await response.text();

  if (!responseText) {
    return new ApiError({
      status: response.status,
      code: "http_error",
      message: `Request failed with status ${response.status}`
    });
  }

  try {
    const body = JSON.parse(responseText) as ApiErrorBody;
    const code = body.error?.code || "http_error";
    const message =
      body.error?.message ||
      body.detail ||
      `Request failed with status ${response.status}`;

    return new ApiError({
      status: response.status,
      code,
      message,
      details: body
    });
  } catch {
    return new ApiError({
      status: response.status,
      code: "http_error",
      message: responseText
    });
  }
}