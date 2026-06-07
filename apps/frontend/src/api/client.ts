import { appConfig } from "../config";
import { createApiError } from "./errors";
import { createRequestId, REQUEST_ID_HEADER } from "./requestId";

export const API_BASE_URL = appConfig.apiBaseUrl;

function createRequestHeaders(headers?: HeadersInit): Headers {
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has(REQUEST_ID_HEADER)) {
    requestHeaders.set(REQUEST_ID_HEADER, createRequestId());
  }

  return requestHeaders;
}

export async function fetchJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: createRequestHeaders(options.headers)
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}