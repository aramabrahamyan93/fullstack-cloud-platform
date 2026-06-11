import { useEffect, useState } from "react";
import { getErrorMessage } from "../shared/api/errors";
import { getHealth, getVersion } from "../features/system/api";
import { useAuth } from "../features/auth/hooks/useAuth";
import { AuthPanel } from "../features/auth/components/AuthPanel";
import { Message, type MessageState, type MessageType } from "../shared/components/Message";
import { SystemStatus } from "../shared/components/SystemStatus";
import { DashboardPage } from "../features/dashboard/components/DashboardPage";
import { OrganizationsPage } from "../features/organizations/components/OrganizationsPage";
import { TasksPage } from "../features/tasks/components/TasksPage";
import { useTasks } from "../features/tasks/hooks/useTasks";
import { useOrganizations } from "../features/organizations/hooks/useOrganizations";
import type { AuthCredentials } from "../features/auth/types";
import type { TaskPageSize, TaskStatus, TaskStatusFilter } from "../features/tasks/types";
import { AppLayout } from "./AppLayout";
import type { AppView } from "./navigation";

export function App() {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [health, setHealth] = useState("loading...");
  const [version, setVersion] = useState("loading...");

  const [message, setMessage] = useState<MessageState>({
    text: "",
    type: "muted"
  });

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
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    await Promise.all([loadSystemStatus(), restoreCurrentUser()]);
  }

  async function loadSystemStatus() {
    try {
      const [healthResponse, versionResponse] = await Promise.all([
        getHealth(),
        getVersion()
      ]);

      setHealth(healthResponse.status);
      setVersion(versionResponse.version);
    } catch (error) {
      setHealth("error");
      setVersion("error");
      showMessage(getErrorMessage(error), "error");
    }
  }

  async function restoreCurrentUser() {
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

  async function handleLogin(credentials: AuthCredentials) {
    showMessage("Logging in...", "muted");

    const result = await login(credentials);

    if (!result.success) {
      clearTasks();
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
    setActiveView("dashboard");
  }

  async function handleRegister(credentials: AuthCredentials) {
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
    setActiveView("dashboard");
  }

  function handleLogout() {
    const result = logout();

    clearTasks();
    clearOrganizations();
    showMessage(result.message, "success");
    setActiveView("dashboard");
  }

  async function handleTaskStatusFilterChange(statusFilter: TaskStatusFilter) {
    const result = await changeTaskStatusFilter(statusFilter);

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleTaskPageSizeChange(nextPageSize: TaskPageSize) {
    const result = await changeTaskPageSize(nextPageSize);

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleTaskSearch(search: string) {
    const result = await changeTaskSearch(search);

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleClearTaskSearch() {
    const result = await clearTaskSearch();

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handlePreviousTaskPage() {
    const result = await goToPreviousTaskPage();

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleNextTaskPage() {
    const result = await goToNextTaskPage();

    if (!result.success) {
      showMessage(result.message, "error");
    }
  }

  async function handleCreateTask(title: string, status: TaskStatus) {
    if (!currentUser) {
      showMessage("Please login before creating tasks.", "error");
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
  ) {
    if (!currentUser) {
      showMessage("Please login before updating tasks.", "error");
      return;
    }

    showMessage(`Updating task #${taskId}...`, "muted");

    const result = await updateUserTask(taskId, title, status);

    showMessage(result.message, result.success ? "success" : "error");
  }

  async function handleDeleteTask(taskId: number) {
    if (!currentUser) {
      showMessage("Please login before deleting tasks.", "error");
      return;
    }

    showMessage(`Deleting task #${taskId}...`, "muted");

    const result = await deleteUserTask(taskId);

    showMessage(result.message, result.success ? "success" : "error");
  }

  async function handleCreateOrganization(name: string) {
    if (!currentUser) {
      showMessage("Please login before creating workspaces.", "error");
      return;
    }

    showMessage("Creating workspace...", "muted");

    const result = await createUserOrganization(name);

    showMessage(result.message, result.success ? "success" : "error");
  }

  function showMessage(text: string, type: MessageType) {
    setMessage({
      text,
      type
    });
  }

  function renderActiveView() {
    if (activeView === "dashboard") {
      return (
        <>
          <AuthPanel
            currentUser={currentUser}
            isLoading={isAuthLoading}
            isSubmitting={isAuthSubmitting}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onLogout={handleLogout}
          />

          <Message message={message} />

          <DashboardPage
            currentUser={currentUser}
            taskCounters={taskCounters}
          />
        </>
      );
    }

    if (activeView === "tasks") {
      return (
        <TasksPage
          currentUserExists={Boolean(currentUser)}
          message={message}
          tasks={tasks}
          taskStatusFilter={taskStatusFilter}
          taskSearch={taskSearch}
          taskCounters={taskCounters}
          currentPage={currentPage}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          totalItems={totalItems}
          totalPages={totalPages}
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          isTasksLoading={isTasksLoading}
          isSubmitting={isSubmitting}
          isMutating={isMutating}
          onCreateTask={handleCreateTask}
          onFilterChange={handleTaskStatusFilterChange}
          onPreviousPage={handlePreviousTaskPage}
          onNextPage={handleNextTaskPage}
          onPageSizeChange={handleTaskPageSizeChange}
          onSearch={handleTaskSearch}
          onClearSearch={handleClearTaskSearch}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      );
    }

    if (activeView === "organizations") {
      return (
        <>
          <Message message={message} />

          <OrganizationsPage
            isAuthenticated={Boolean(currentUser)}
            organizations={organizations}
            selectedOrganization={selectedOrganization}
            isLoading={isOrganizationsLoading}
            isSubmitting={isOrganizationSubmitting}
            onCreateOrganization={handleCreateOrganization}
            onSelectOrganization={selectOrganization}
          />
        </>
      );
    }

    return (
      <>
        <Message message={message} />

        <section className="page-header">
          <div>
            <h1>System Status</h1>
            <p className="card-subtitle">
              Backend health, API base URL, and current application version.
            </p>
          </div>
        </section>

        <SystemStatus health={health} version={version} />
      </>
    );
  }

  return (
    <AppLayout
      activeView={activeView}
      currentUser={currentUser}
      onNavigate={setActiveView}
    >
      {renderActiveView()}
    </AppLayout>
  );
}
