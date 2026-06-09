export type TaskStatus = "open" | "in_progress" | "done";

export type TaskStatusFilter = "all" | TaskStatus;

export type Task = {
  id: number;
  title: string;
  status: TaskStatus;
};

export type TaskStatusCounters = Record<TaskStatusFilter, number>;

export type CreateTaskRequest = {
  title: string;
  status: TaskStatus;
};

export type UpdateTaskRequest = {
  title: string;
  status: TaskStatus;
};