import { fetchJson } from "../../shared/api/client";
import type {
  AuthCredentials,
  TokenResponse,
  User
} from "./types";

export async function registerUser(
  credentials: AuthCredentials
): Promise<User> {
  return fetchJson<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export async function loginUser(
  credentials: AuthCredentials
): Promise<TokenResponse> {
  return fetchJson<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export async function getCurrentUser(): Promise<User> {
  return fetchJson<User>("/auth/me");
}