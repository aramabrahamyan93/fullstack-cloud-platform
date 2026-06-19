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

const API_ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  workspace_owner_required:
    "Only workspace owners can perform this action.",
  workspace_owner_cannot_leave_before_transfer:
    "Transfer ownership before leaving this workspace.",
  workspace_archived:
    "This workspace is archived and read-only.",
  workspace_invitation_invalid_role:
    "Only member invitations are supported for now.",
  workspace_invitation_user_already_member:
    "This user is already a workspace member.",
  workspace_invitation_already_pending:
    "A pending invitation already exists for this email.",
  workspace_invitation_not_pending:
    "This invitation is no longer pending.",
  workspace_invitation_expired:
    "This invitation has expired.",
  workspace_member_self_remove_not_allowed:
    "You cannot remove yourself from the workspace.",
  workspace_member_owner_remove_not_allowed:
    "Workspace owners cannot be removed directly."
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return API_ERROR_MESSAGE_BY_CODE[error.code] ?? error.message;
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
