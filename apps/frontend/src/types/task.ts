export type TaskStatus = "open" | "in_progress" | "done";

export type TaskStatusFilter = "all" | TaskStatus;

export type Task = {
  id: number;
  title: string;
  status: TaskStatus;
};

export type PaginatedTasksResponse = {
  items: Task[];
  total: number;
  limit: number;
  offset: number;
};

export type TaskStatusCounters = Record<TaskStatusFilter, number>;

export type TaskPagination = {
  page: number;
  pageSize: number;
  offset: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type TaskQueryParams = {
  statusFilter?: TaskStatusFilter;
  limit?: number;
  offset?: number;
};

export type CreateTaskRequest = {
  title: string;
  status: TaskStatus;
};

export type UpdateTaskRequest = {
  title: string;
  status: TaskStatus;
};