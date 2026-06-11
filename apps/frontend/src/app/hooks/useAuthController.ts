import { useNavigate } from "react-router-dom";
import type { AuthCredentials, User } from "../../features/auth/types";
import type { MessageType } from "../../shared/components/Message";

type ActionResult = {
  success: boolean;
  message: string;
};

type UseAuthControllerOptions = {
  loadCurrentUser: () => Promise<User | null>;
  login: (credentials: AuthCredentials) => Promise<ActionResult>;
  register: (credentials: AuthCredentials) => Promise<ActionResult>;
  logout: () => ActionResult;
  loadOrganizations: () => Promise<ActionResult>;
  clearWorkspaceState: () => void;
  clearTasks: () => void;
  showMessage: (text: string, type: MessageType) => void;
};

export function useAuthController({
  loadCurrentUser,
  login,
  register,
  logout,
  loadOrganizations,
  clearWorkspaceState,
  clearTasks,
  showMessage
}: UseAuthControllerOptions) {
  const navigate = useNavigate();

  async function restoreCurrentUser(): Promise<void> {
    const user = await loadCurrentUser();

    if (!user) {
      clearTasks();
      clearWorkspaceState();
      return;
    }

    const organizationsResult = await loadOrganizations();

    if (!organizationsResult.success) {
      showMessage(organizationsResult.message, "error");
    }
  }

  async function handleLogin(credentials: AuthCredentials): Promise<void> {
    showMessage("Logging in...", "muted");

    const result = await login(credentials);

    if (!result.success) {
      clearTasks();
      clearWorkspaceState();
      showMessage(result.message, "error");
      return;
    }

    const organizationsResult = await loadOrganizations();

    if (!organizationsResult.success) {
      showMessage(organizationsResult.message, "error");
      return;
    }

    showMessage(result.message, "success");
    navigate("/dashboard");
  }

  async function handleRegister(credentials: AuthCredentials): Promise<void> {
    showMessage("Registering user...", "muted");

    const result = await register(credentials);

    if (!result.success) {
      showMessage(result.message, "error");
      return;
    }

    const organizationsResult = await loadOrganizations();

    if (!organizationsResult.success) {
      showMessage(organizationsResult.message, "error");
      return;
    }

    showMessage(result.message, "success");
    navigate("/dashboard");
  }

  function handleLogout(): void {
    const result = logout();

    clearTasks();
    clearWorkspaceState();
    showMessage(result.message, "success");
    navigate("/dashboard");
  }

  return {
    restoreCurrentUser,
    handleLogin,
    handleRegister,
    handleLogout
  };
}

export type AuthController = ReturnType<typeof useAuthController>;
