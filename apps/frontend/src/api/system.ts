import { fetchJson } from "./client";

export type HealthResponse = {
  status: string;
  environment?: string;
};

export type VersionResponse = {
  version: string;
};

export function getHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>("/health");
}

export function getVersion(): Promise<VersionResponse> {
  return fetchJson<VersionResponse>("/version");
}