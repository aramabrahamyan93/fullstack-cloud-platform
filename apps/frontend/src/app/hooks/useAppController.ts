import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useOrganizations } from "../../features/organizations/hooks/useOrganizations";
import { useTasks } from "../../features/tasks/hooks/useTasks";
import type { AuthCredentials } from "../../features/auth/types";
import type {
  TaskPageSize,
  TaskStatus,
  TaskStatusFilter
} from "../../features/tasks/types";
import { useAppMessage } from "./useAppMessage";
import { useSystemStatus } from "./useSystemStatus";

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
    tasks,
    taskStatusFilter,
    taskSearch,
    taskCounters,
    currentPage,
    pageSize,
    pageSizeOptions,
    totalItems,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    isTasksLoading,
    isSubmitting,
    isMutating,
    changeTaskStatusFilter,
    changeTaskPageSize,
    changeTaskSearch,
    clearTaskSearch,
    goToPreviousTaskPage,
    goToNextTaskPage,
    loadTasks,
    clearTasks,
    createUserTask,
    updateUserTask,
    deleteUserTask
  } = useTasks();

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
      clearTasks();
      clearOrganizations();
      return;
    }

    const [tasksResult, organizationsResult] = await Promise.all([
      loadTasks(),
      loadOrganizations()
    ]);

    if (!tasksResult.success) {
      showMessage(tasksResult.message, "error");
      return;
    }

    if (!organizationsResult.success) {
      showMessage(organizationsResult.message, "error");
    }
  }

  async function handleLogin(credentials: AuthCredentials): Promise<void> {
    showMessage("Logging in...", "muted");

    const result = await login(credentials);

    if (!result.success) {
      clearTasks();
      clearOrganizations();
      showMessage(result.message, "error");
      return;
    }

    const [tasksResult, organizationsResult] = await Promise.all([
      loadTasks(),
      loadOrganizations()
    ]);

    if (!tasksResult.success) {
      showMessage(tasksResult.message, "error");
      return;
    }

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

    const [tasksResult, organizationsResult] = await Promise.all([
      loadTasks(),
      loadOrganizations()
    ]);

    if (!tasksResult.success) {
      showMessage(tasksResult.message, "error");
      return;
    }

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
    clearOrganizations();
    showMessage(result.message, "success");
    navigate("/dashboard");
  }

  async function handleTaskStatusFilterChange(
    statusFilter: TaskStatusFilter
  ): Promise<void> {
    const result = await changeTaskStatusFilter(statusFilter);

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleTaskPageSizeChange(
    nextPageSize: TaskPageSize
  ): Promise<void> {
    const result = await changeTaskPageSize(nextPageSize);

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleTaskSearch(search: string): Promise<void> {
    const result = await changeTaskSearch(search);

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleClearTaskSearch(): Promise<void> {
    const result = await clearTaskSearch();

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handlePreviousTaskPage(): Promise<void> {
    const result = await goToPreviousTaskPage();

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleNextTaskPage(): Promise<void> {
    const result = await goToNextTaskPage();

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleCreateTask(
    title: string,
    status: TaskStatus
  ): Promise<void> {
    if (!currentUser) {
      showMessage("Please login before creating tasks.", "error");
      return;
    }

    if (!selectedOrganization) {
      showMessage(
        "Please create or select a workspace before creating tasks.",
        "error"
      );
      navigate("/workspaces");
      return;
    }

    showMessage("Creating task...", "muted");

    const result = await createUserTask(title, status);

    showMessage(result.message, result.success ? "success" : "error");
  }

  async function handleUpdateTask(
    taskId: number,
    title: string,
    status: TaskStatus
  ): Promise<void> {
    if (!currentUser) {
      showMessage("Please login before updating tasks.", "error");
      return;
    }

    showMessage(`Updating task #${taskId}...`, "muted");

    const result = await updateUserTask(taskId, title, status);

    showMessage(result.message, result.success ? "success" : "error");
  }

  async function handleDeleteTask(taskId: number): Promise<void> {
    if (!currentUser) {
      showMessage("Please login before deleting tasks.", "error");
      return;
    }

    showMessage(`Deleting task #${taskId}...`, "muted");

    const result = await deleteUserTask(taskId);

    showMessage(result.message, result.success ? "success" : "error");
  }

  async function handleCreateOrganization(name: string): Promise<void> {
    if (!currentUser) {
      showMessage("Please login before creating workspaces.", "error");
      return;
    }

    showMessage("Creating workspace...", "muted");

    const result = await createUserOrganization(name);

    showMessage(result.message, result.success ? "success" : "error");
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

    tasks,
    taskStatusFilter,
    taskSearch,
    taskCounters,
    currentPage,
    pageSize,
    pageSizeOptions,
    totalItems,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    isTasksLoading,
    isSubmitting,
    isMutating,

    organizations,
    selectedOrganization,
    isOrganizationsLoading,
    isOrganizationSubmitting,

    handleLogin,
    handleRegister,
    handleLogout,

    handleTaskStatusFilterChange,
    handleTaskPageSizeChange,
    handleTaskSearch,
    handleClearTaskSearch,
    handlePreviousTaskPage,
    handleNextTaskPage,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,

    handleCreateOrganization,
    handleSelectOrganization,
    selectWorkspaceFromRoute
  };
}

export type AppController = ReturnType<typeof useAppController>;
