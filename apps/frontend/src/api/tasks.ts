import { fetchJson } from "./client";
import type {
  CreateTaskRequest,
  Task,
  TaskStatusFilter,
  UpdateTaskRequest
} from "../types/task";

export type GetTasksParams = {
  statusFilter?: TaskStatusFilter;
  limit?: number;
  offset?: number;
};

export function getTasks({
  statusFilter = "all",
  limit,
  offset
}: GetTasksParams = {}): Promise<Task[]> {
  const queryParams = new URLSearchParams();

  if (statusFilter !== "all") {
    queryParams.set("status", statusFilter);
  }

  if (limit !== undefined) {
    queryParams.set("limit", String(limit));
  }

  if (offset !== undefined) {
    queryParams.set("offset", String(offset));
  }

  const query = queryParams.toString();
  const path = query ? `/tasks?${query}` : "/tasks";

  return fetchJson<Task[]>(path);
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