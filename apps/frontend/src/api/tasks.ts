import { fetchJson } from "./client";
import type {
  CreateTaskRequest,
  PaginatedTasksResponse,
  Task,
  TaskQueryParams,
  TaskStatsResponse,
  UpdateTaskRequest
} from "../types/task";

function buildTaskQueryString({
  statusFilter = "all",
  search,
  limit,
  offset
}: TaskQueryParams = {}): string {
  const queryParams = new URLSearchParams();
  const normalizedSearch = search?.trim();

  if (statusFilter !== "all") {
    queryParams.set("status", statusFilter);
  }

  if (normalizedSearch) {
    queryParams.set("search", normalizedSearch);
  }

  if (limit !== undefined) {
    queryParams.set("limit", String(limit));
  }

  if (offset !== undefined) {
    queryParams.set("offset", String(offset));
  }

  return queryParams.toString();
}

export function getTasks(params: TaskQueryParams = {}): Promise<Task[]> {
  const query = buildTaskQueryString(params);
  const path = query ? `/tasks?${query}` : "/tasks";

  return fetchJson<Task[]>(path);
}

export function getPaginatedTasks(
  params: TaskQueryParams = {}
): Promise<PaginatedTasksResponse> {
  const query = buildTaskQueryString(params);
  const path = query ? `/tasks/paginated?${query}` : "/tasks/paginated";

  return fetchJson<PaginatedTasksResponse>(path);
}

export function getTaskStats(): Promise<TaskStatsResponse> {
  return fetchJson<TaskStatsResponse>("/tasks/stats");
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