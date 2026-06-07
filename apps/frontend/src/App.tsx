import { useEffect, useState } from "react";
import { appConfig } from "./config";
import { createTask, getTasks } from "./api/tasks";
import { getHealth, getVersion } from "./api/system";
import { SystemStatus } from "./components/SystemStatus";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import type { Task, TaskStatus } from "./types/task";

type MessageType = "muted" | "success" | "error";

type Message = {
  text: string;
  type: MessageType;
};

export function App() {
  const [health, setHealth] = useState("loading...");
  const [version, setVersion] = useState("loading...");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message>({
    text: "",
    type: "muted"
  });

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    await Promise.all([loadSystemStatus(), loadTasks()]);
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

  function showMessage(text: string, type: MessageType) {
    setMessage({
      text,
      type
    });
  }

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return "Unexpected error.";
  }

  return (
    <main className="page">
      <h1>{appConfig.appTitle}</h1>

      <SystemStatus health={health} version={version} />

      <TaskForm
        isSubmitting={isSubmitting}
        onCreateTask={handleCreateTask}
      />

      {message.text ? <p className={message.type}>{message.text}</p> : null}

      <TaskList tasks={tasks} isLoading={isTasksLoading} />
    </main>
  );
}