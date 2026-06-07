export type TaskStatus = "open" | "in_progress" | "done";

export type Task = {
  id: number;
  title: string;
  status: TaskStatus;
};

export type CreateTaskRequest = {
  title: string;
  status: TaskStatus;
};

export type UpdateTaskRequest = {
  title: string;
  status: TaskStatus;
};