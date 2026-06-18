import { fetchJson } from "../../shared/api/client";
import type { OrganizationRef } from "../organizations/types";
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

function toTaskOrganizationPathRef(organizationRef: OrganizationRef): string {
  return encodeURIComponent(String(organizationRef));
}

function getTaskBasePath(organizationRef?: OrganizationRef): string {
  if (organizationRef !== undefined) {
    return `/organizations/${toTaskOrganizationPathRef(organizationRef)}/tasks`;
  }

  return "/tasks";
}

export function getTasks(
  params: TaskQueryParams = {},
  organizationRef?: OrganizationRef
): Promise<Task[]> {
  const query = buildTaskQueryString(params);
  const basePath = getTaskBasePath(organizationRef);
  const path = query ? `${basePath}?${query}` : basePath;

  return fetchJson<Task[]>(path);
}

export function getPaginatedTasks(
  params: TaskQueryParams = {},
  organizationRef?: OrganizationRef
): Promise<PaginatedTasksResponse> {
  const query = buildTaskQueryString(params);
  const basePath = getTaskBasePath(organizationRef);
  const path = query ? `${basePath}/paginated?${query}` : `${basePath}/paginated`;

  return fetchJson<PaginatedTasksResponse>(path);
}

export function getTaskStats(
  organizationRef?: OrganizationRef
): Promise<TaskStatsResponse> {
  return fetchJson<TaskStatsResponse>(`${getTaskBasePath(organizationRef)}/stats`);
}

export function getTask(
  taskId: number,
  organizationRef?: OrganizationRef
): Promise<Task> {
  return fetchJson<Task>(`${getTaskBasePath(organizationRef)}/${taskId}`);
}

export function createTask(
  payload: CreateTaskRequest,
  organizationRef?: OrganizationRef
): Promise<Task> {
  return fetchJson<Task>(getTaskBasePath(organizationRef), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTask(
  taskId: number,
  payload: UpdateTaskRequest,
  organizationRef?: OrganizationRef
): Promise<Task> {
  return fetchJson<Task>(`${getTaskBasePath(organizationRef)}/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteTask(
  taskId: number,
  organizationRef?: OrganizationRef
): Promise<void> {
  return fetchJson<void>(`${getTaskBasePath(organizationRef)}/${taskId}`, {
    method: "DELETE"
  });
}
