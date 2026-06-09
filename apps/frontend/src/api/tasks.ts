import { fetchJson } from "./client";
import type {
  CreateTaskRequest,
  Task,
  TaskStatusFilter,
  UpdateTaskRequest
} from "../types/task";

export function getTasks(statusFilter: TaskStatusFilter = "all"): Promise<Task[]> {
  const query = statusFilter === "all" ? "" : `?status=${statusFilter}`;

  return fetchJson<Task[]>(`/tasks${query}`);
}

export function getTask(taskId: number): Promise<Task> {
  return fetchJson<Task>(`/tasks/${taskId}`);
}

export function createTask(payload: CreateTaskRequest): Promise<Task> {
  return fetchJson<Task>("/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function updateTask(
  taskId: number,
  payload: UpdateTaskRequest
): Promise<Task> {
  return fetchJson<Task>(`/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function deleteTask(taskId: number): Promise<void> {
  return fetchJson<void>(`/tasks/${taskId}`, {
    method: "DELETE"
  });
}