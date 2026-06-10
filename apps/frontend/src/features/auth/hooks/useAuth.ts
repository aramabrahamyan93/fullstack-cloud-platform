import { useState } from "react";
import {
  getCurrentUser,
  loginUser,
  registerUser
} from "../api";
import { getErrorMessage } from "../../../api/errors";
import {
  clearAccessToken,
  saveAccessToken
} from "../tokenStorage";
import type { AuthCredentials, User } from "../types";

export type AuthResult = {
  success: boolean;
  message: string;
};

export type UseAuthResult = {
  currentUser: User | null;
  isAuthLoading: boolean;
  isAuthSubmitting: boolean;
  loadCurrentUser: () => Promise<User | null>;
  login: (credentials: AuthCredentials) => Promise<AuthResult>;
  register: (credentials: AuthCredentials) => Promise<AuthResult>;
  logout: () => AuthResult;
};

export function useAuth(): UseAuthResult {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  async function loadCurrentUser(): Promise<User | null> {
    setIsAuthLoading(true);

    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      return user;
    } catch {
      clearAuthState();
      return null;
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function login(credentials: AuthCredentials): Promise<AuthResult> {
    setIsAuthSubmitting(true);

    try {
      const tokenResponse = await loginUser(credentials);
      saveAccessToken(tokenResponse.access_token);

      const user = await getCurrentUser();
      setCurrentUser(user);

      return {
        success: true,
        message: "Logged in successfully."
      };
    } catch (error) {
      clearAuthState();

      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function register(credentials: AuthCredentials): Promise<AuthResult> {
    setIsAuthSubmitting(true);

    try {
      await registerUser(credentials);

      const tokenResponse = await loginUser(credentials);
      saveAccessToken(tokenResponse.access_token);

      const user = await getCurrentUser();
      setCurrentUser(user);

      return {
        success: true,
        message: "Registered and logged in successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error)
      };
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  function logout(): AuthResult {
    clearAuthState();

    return {
      success: true,
      message: "Logged out successfully."
    };
  }

  function clearAuthState(): void {
    clearAccessToken();
    setCurrentUser(null);
  }

  return {
    currentUser,
    isAuthLoading,
    isAuthSubmitting,
    loadCurrentUser,
    login,
    register,
    logout
  };
}