import { getAccessToken } from "../../features/auth/tokenStorage";
import { appConfig } from "../../app/config";
import { createApiError } from "./errors";

export const API_BASE_URL = appConfig.apiBaseUrl;

export async function fetchJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers)
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function buildHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  const accessToken = getAccessToken();

  if (!result.has("Content-Type")) {
    result.set("Content-Type", "application/json");
  }

  if (accessToken && !result.has("Authorization")) {
    result.set("Authorization", `Bearer ${accessToken}`);
  }

  return result;
}