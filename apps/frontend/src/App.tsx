import { useEffect, useState } from "react";
import { appConfig } from "./config";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask
} from "./api/tasks";
import { getErrorMessage } from "./api/errors";
import { getHealth, getVersion } from "./api/system";
import { useAuth } from "./auth/useAuth";
import { AuthPanel } from "./components/AuthPanel";
import { Message, type MessageState, type MessageType } from "./components/Message";
import { SystemStatus } from "./components/SystemStatus";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import type { AuthCredentials } from "./types/auth";
import type { Task, TaskStatus } from "./types/task";

export function App() {
  const [health, setHealth] = useState("loading...");
  const [version, setVersion] = useState("loading...");
  const [tasks, setTasks] = useState<Task[]>([]);

  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

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
      setTasks([]);
      setIsTasksLoading(false);
      return;
    }

    await loadTasks();
  }

  async function handleLogin(credentials: AuthCredentials) {
    showMessage("Logging in...", "muted");

    const result = await login(credentials);

    if (!result.success) {
      setTasks([]);
      showMessage(result.message, "error");
      return;
    }

    await loadTasks();
    showMessage(result.message, "success");
  }

  async function handleRegister(credentials: AuthCredentials) {
    showMessage("Registering user...", "muted");

    const result = await register(credentials);

    if (!result.success) {
      showMessage(result.message, "error");
      return;
    }

    await loadTasks();
    showMessage(result.message, "success");
  }

  function handleLogout() {
    const result = logout();

    setTasks([]);
    setIsTasksLoading(false);
    showMessage(result.message, "success");
  }

  async function loadTasks() {
    setIsTasksLoading(true);

    try {
      const taskList = await getTasks();
      setTasks(taskList);
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setIsTasksLoading(false);
    }
  }

  async function handleCreateTask(title: string, status: TaskStatus) {
    if (!currentUser) {
      showMessage("Please login before creating tasks.", "error");
      return;
    }

    setIsSubmitting(true);
    showMessage("Creating task...", "muted");

    try {
      await createTask({
        title,
        status
      });

      showMessage("Task created successfully.", "success");
      await loadTasks();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
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

    setIsMutating(true);
    showMessage(`Updating task #${taskId}...`, "muted");

    try {
      await updateTask(taskId, {
        title,
        status
      });

      showMessage(`Task #${taskId} updated successfully.`, "success");
      await loadTasks();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteTask(taskId: number) {
    if (!currentUser) {
      showMessage("Please login before deleting tasks.", "error");
      return;
    }

    setIsMutating(true);
    showMessage(`Deleting task #${taskId}...`, "muted");

    try {
      await deleteTask(taskId);
      showMessage(`Task #${taskId} deleted successfully.`, "success");
      await loadTasks();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setIsMutating(false);
    }
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

          <Message message={message} />

          <TaskList
            tasks={tasks}
            isLoading={isTasksLoading}
            isMutating={isMutating}
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
                  <p className="card-subtitle">Protected task management is available after login.</p>
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