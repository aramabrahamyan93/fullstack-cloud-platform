import { fetchJson } from "../../shared/api/client";
import type {
  CreateTaskRequest,
  PaginatedTasksResponse,
  Task,
  TaskQueryParams,
  TaskStatsResponse,
  UpdateTaskRequest
} from "./types";

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

function getTaskBasePath(organizationId?: number): string {
  if (organizationId !== undefined) {
    return `/organizations/${organizationId}/tasks`;
  }

  return "/tasks";
}

export function getTasks(
  params: TaskQueryParams = {},
  organizationId?: number
): Promise<Task[]> {
  const query = buildTaskQueryString(params);
  const basePath = getTaskBasePath(organizationId);
  const path = query ? `${basePath}?${query}` : basePath;

  return fetchJson<Task[]>(path);
}

export function getPaginatedTasks(
  params: TaskQueryParams = {},
  organizationId?: number
): Promise<PaginatedTasksResponse> {
  const query = buildTaskQueryString(params);
  const basePath = getTaskBasePath(organizationId);
  const path = query ? `${basePath}/paginated?${query}` : `${basePath}/paginated`;

  return fetchJson<PaginatedTasksResponse>(path);
}

export function getTaskStats(
  organizationId?: number
): Promise<TaskStatsResponse> {
  return fetchJson<TaskStatsResponse>(`${getTaskBasePath(organizationId)}/stats`);
}

export function getTask(
  taskId: number,
  organizationId?: number
): Promise<Task> {
  return fetchJson<Task>(`${getTaskBasePath(organizationId)}/${taskId}`);
}

export function createTask(
  payload: CreateTaskRequest,
  organizationId?: number
): Promise<Task> {
  return fetchJson<Task>(getTaskBasePath(organizationId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTask(
  taskId: number,
  payload: UpdateTaskRequest,
  organizationId?: number
): Promise<Task> {
  return fetchJson<Task>(`${getTaskBasePath(organizationId)}/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteTask(
  taskId: number,
  organizationId?: number
): Promise<void> {
  return fetchJson<void>(`${getTaskBasePath(organizationId)}/${taskId}`, {
    method: "DELETE"
  });
}
