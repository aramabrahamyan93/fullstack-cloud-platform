import { useEffect } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useAppMessage } from "./useAppMessage";
import { useAuthController } from "./useAuthController";
import { useSystemStatus } from "./useSystemStatus";
import { useTaskController } from "./useTaskController";
import { useWorkspaceController } from "./useWorkspaceController";

export function useAppController() {
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

  const workspaceController = useWorkspaceController({
    currentUser,
    showMessage
  });

  const taskController = useTaskController({
    currentUser,
    selectedOrganization: workspaceController.selectedOrganization,
    showMessage
  });

  const authController = useAuthController({
    loadCurrentUser,
    login,
    register,
    logout,
    loadOrganizations: workspaceController.loadOrganizations,
    clearOrganizations: workspaceController.clearOrganizations,
    clearTasks: taskController.clearTasks,
    showMessage
  });

  useEffect(() => {
    void loadApp();
  }, []);

  async function loadApp(): Promise<void> {
    const [systemResult] = await Promise.all([
      loadSystemStatus(),
      authController.restoreCurrentUser()
    ]);

    if (!systemResult.success) {
      showMessage(systemResult.message, "error");
    }
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
    ...workspaceController,
    ...authController
  };
}

export type AppController = ReturnType<typeof useAppController>;
