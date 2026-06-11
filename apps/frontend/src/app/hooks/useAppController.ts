import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useOrganizations } from "../../features/organizations/hooks/useOrganizations";
import type { AuthCredentials } from "../../features/auth/types";
import { useAppMessage } from "./useAppMessage";
import { useSystemStatus } from "./useSystemStatus";
import { useTaskController } from "./useTaskController";

export function useAppController() {
  const navigate = useNavigate();
  const { message, showMessage, clearMessage } = useAppMessage();
  const { health, version, loadSystemStatus } = useSystemStatus();

  const {
    currentUser,
    isAuthLoading,
    isAuthSubmitting,
    loadCurrentUser,
    login,
    register,
    logout
  } = useAuth();

  const {
    organizations,
    selectedOrganization,
    isOrganizationsLoading,
    isOrganizationSubmitting,
    loadOrganizations,
    clearOrganizations,
    selectOrganization,
    createUserOrganization
  } = useOrganizations();

  const taskController = useTaskController({
    currentUser,
    selectedOrganization,
    showMessage
  });

  useEffect(() => {
    void loadApp();
  }, []);

  async function loadApp(): Promise<void> {
    const [systemResult] = await Promise.all([
      loadSystemStatus(),
      restoreCurrentUser()
    ]);

    if (!systemResult.success) {
      showMessage(systemResult.message, "error");
    }
  }

  async function restoreCurrentUser(): Promise<void> {
    const user = await loadCurrentUser();

    if (!user) {
      taskController.clearTasks();
      clearOrganizations();
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
      taskController.clearTasks();
      clearOrganizations();
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

    taskController.clearTasks();
    clearOrganizations();
    showMessage(result.message, "success");
    navigate("/dashboard");
  }

  async function handleCreateOrganization(name: string): Promise<void> {
    if (!currentUser) {
      showMessage("Please login before creating workspaces.", "error");
      return;
    }

    showMessage("Creating workspace...", "muted");

    const result = await createUserOrganization(name);

    showMessage(result.message, result.success ? "success" : "error");

    if (result.success && result.organization) {
      navigate(`/workspaces/${result.organization.id}/tasks`);
    }
  }

  function handleSelectOrganization(organizationId: number): void {
    selectOrganization(organizationId);
    navigate(`/workspaces/${organizationId}/tasks`);
  }

  function selectWorkspaceFromRoute(organizationId: number): void {
    selectOrganization(organizationId);
  }

  return {
    message,
    showMessage,
    clearMessage,

    health,
    version,

    currentUser,
    isAuthLoading,
    isAuthSubmitting,

    ...taskController,

    organizations,
    selectedOrganization,
    isOrganizationsLoading,
    isOrganizationSubmitting,

    handleLogin,
    handleRegister,
    handleLogout,

    handleCreateOrganization,
    handleSelectOrganization,
    selectWorkspaceFromRoute
  };
}

export type AppController = ReturnType<typeof useAppController>;
