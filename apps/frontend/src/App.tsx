import { useEffect, useState } from "react";
import { appConfig } from "./config";
import { getErrorMessage } from "./api/errors";
import { getHealth, getVersion } from "./api/system";
import { useAuth } from "./features/auth/hooks/useAuth";
import { AuthPanel } from "./features/auth/components/AuthPanel";
import { Message, type MessageState, type MessageType } from "./components/Message";
import { SystemStatus } from "./components/SystemStatus";
import { TaskForm } from "./features/tasks/components/TaskForm";
import { TaskList } from "./features/tasks/components/TaskList";
import { TaskDashboard } from "./features/tasks/components/TaskDashboard";
import { useTasks } from "./features/tasks/hooks/useTasks";
import type { AuthCredentials } from "./features/auth/types";
import type { TaskPageSize, TaskStatus, TaskStatusFilter } from "./features/tasks/types";

export function App() {
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
      return;
    }

    const result = await loadTasks();

    if (!result.success) {
      showMessage(result.message, "error");
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

    const tasksResult = await loadTasks();

    if (!tasksResult.success) {
      showMessage(tasksResult.message, "error");
      return;
    }

    showMessage(result.message, "success");
  }

  async function handleRegister(credentials: AuthCredentials) {
    showMessage("Registering user...", "muted");

    const result = await register(credentials);

    if (!result.success) {
      showMessage(result.message, "error");
      return;
    }

    const tasksResult = await loadTasks();

    if (!tasksResult.success) {
      showMessage(tasksResult.message, "error");
      return;
    }

    showMessage(result.message, "success");
  }

  function handleLogout() {
    const result = logout();

    clearTasks();
    showMessage(result.message, "success");
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

  function showMessage(text: string, type: MessageType) {
    setMessage({
      text,
      type
    });
  }

  return (
    <main className="page">
      <h1>{appConfig.appTitle}</h1>

      <SystemStatus health={health} version={version} />

      <AuthPanel
        currentUser={currentUser}
        isLoading={isAuthLoading}
        isSubmitting={isAuthSubmitting}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />

      {currentUser ? (
        <>
          <TaskForm
            isSubmitting={isSubmitting}
            onCreateTask={handleCreateTask}
          />

          <TaskDashboard
            counters={taskCounters}
            activeFilter={taskStatusFilter}
            onFilterChange={handleTaskStatusFilterChange}
          />

          <Message message={message} />

          <TaskList
            tasks={tasks}
            activeFilter={taskStatusFilter}
            search={taskSearch}
            currentPage={currentPage}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            totalItems={totalItems}
            totalPages={totalPages}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            isLoading={isTasksLoading}
            isMutating={isMutating}
            onPreviousPage={handlePreviousTaskPage}
            onNextPage={handleNextTaskPage}
            onPageSizeChange={handleTaskPageSizeChange}
            onSearch={handleTaskSearch}
            onClearSearch={handleClearTaskSearch}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        </>
      ) : (
        <>
          <Message message={message} />

          <section className="card">
            <div className="card-header">
              <div>
                <h2>Tasks</h2>
                <p className="card-subtitle">
                  Protected task management is available after login.
                </p>
              </div>
            </div>

            <div className="empty-state">
              Please login or register to manage your tasks.
            </div>
          </section>
        </>
      )}
    </main>
  );
}